package service

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/minio/minio-go/v7"
)

// PrototypeService 原型项目管理服务
type PrototypeService struct {
	protoRepo   *repository.PrototypeRepository
	minioClient *minio.Client
	bucket      string
}

// NewPrototypeService 创建 PrototypeService 实例
func NewPrototypeService(
	repo *repository.PrototypeRepository,
	minioClient *minio.Client,
	bucket string,
) *PrototypeService {
	return &PrototypeService{
		protoRepo:   repo,
		minioClient: minioClient,
		bucket:      bucket,
	}
}

const (
	maxPrototypeSize = 20 * 1024 * 1024 // 20MB
)

// Upload 上传并解压 zip 原型文件到 MinIO，创建数据库记录
func (s *PrototypeService) Upload(
	zipFile multipart.File,
	header *multipart.FileHeader,
	name string,
) (*model.Prototype, error) {
	// 1. 校验文件类型必须是 .zip
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".zip") {
		return nil, fmt.Errorf("只支持 .zip 格式的文件")
	}

	// 2. 校验文件大小不超过 20MB
	if header.Size > maxPrototypeSize {
		return nil, fmt.Errorf("文件大小超过限制（最大 20MB）")
	}

	// 3. 读取 zip 内容到内存
	zipData, err := io.ReadAll(zipFile)
	if err != nil {
		return nil, fmt.Errorf("读取 zip 文件失败: %w", err)
	}

	// 4. 解压并校验必须包含 index.html
	zipReader, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return nil, fmt.Errorf("解压 zip 文件失败: %w", err)
	}

	hasIndexHTML := false
	fileCount := 0
	for _, f := range zipReader.File {
		if f.FileInfo().IsDir() {
			continue
		}
		fileCount++
		if strings.ToLower(f.Name) == "index.html" {
			hasIndexHTML = true
		}
	}

	if !hasIndexHTML {
		return nil, fmt.Errorf("zip 包中必须包含 index.html 文件")
	}

	// 5. 先创建数据库记录拿到 ID
	prototype := &model.Prototype{
		Name: name,
	}
	if err := s.protoRepo.Create(prototype); err != nil {
		return nil, fmt.Errorf("创建原型记录失败: %w", err)
	}

	// 6. 将每个文件上传到 MinIO，key 格式：prototypes/{id}/filename
	ctx := context.Background()
	for _, f := range zipReader.File {
		if f.FileInfo().IsDir() {
			continue
		}

		objectName := fmt.Sprintf("prototypes/%d/%s", prototype.ID, f.Name)

		rc, err := f.Open()
		if err != nil {
			// 上传失败，清理已创建的数据库记录
			s.protoRepo.Delete(prototype.ID)
			return nil, fmt.Errorf("打开 zip 内文件 %s 失败: %w", f.Name, err)
		}

		fileData, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			s.protoRepo.Delete(prototype.ID)
			return nil, fmt.Errorf("读取 zip 内文件 %s 失败: %w", f.Name, err)
		}

		contentType := detectContentType(f.Name)
		_, err = s.minioClient.PutObject(
			ctx,
			s.bucket,
			objectName,
			bytes.NewReader(fileData),
			int64(len(fileData)),
			minio.PutObjectOptions{
				ContentType: contentType,
			},
		)
		if err != nil {
			// 上传失败，清理已创建的数据库记录
			s.protoRepo.Delete(prototype.ID)
			return nil, fmt.Errorf("上传文件 %s 到 MinIO 失败: %w", f.Name, err)
		}
	}

	// 7. 更新 file_count 和 storage_prefix
	prototype.FileCount = fileCount
	prototype.StoragePrefix = fmt.Sprintf("prototypes/%d/", prototype.ID)
	if err := s.protoRepo.Update(prototype); err != nil {
		return nil, fmt.Errorf("更新文件计数失败: %w", err)
	}

	return prototype, nil
}

// List 获取所有原型列表
func (s *PrototypeService) List() ([]model.Prototype, error) {
	return s.protoRepo.FindAll()
}

// Delete 删除原型（包括 MinIO 文件与数据库记录）
func (s *PrototypeService) Delete(id uint) error {
	// 1. 先获取原型记录
	prototype, err := s.protoRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("原型不存在: %w", err)
	}

	// 2. 删除 MinIO 中 prototypes/{id}/ 前缀下的所有文件
	ctx := context.Background()
	prefix := fmt.Sprintf("prototypes/%d/", prototype.ID)
	objectsCh := s.minioClient.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	for object := range objectsCh {
		if object.Err != nil {
			return fmt.Errorf("列出 MinIO 对象失败: %w", object.Err)
		}
		err := s.minioClient.RemoveObject(ctx, s.bucket, object.Key, minio.RemoveObjectOptions{})
		if err != nil {
			return fmt.Errorf("删除 MinIO 对象 %s 失败: %w", object.Key, err)
		}
	}

	// 3. 删除数据库记录
	if err := s.protoRepo.Delete(id); err != nil {
		return fmt.Errorf("删除数据库记录失败: %w", err)
	}

	return nil
}

// detectContentType 根据文件名后缀返回 MIME 类型
func detectContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".html", ".htm":
		return "text/html"
	case ".css":
		return "text/css"
	case ".js":
		return "application/javascript"
	case ".json":
		return "application/json"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	case ".otf":
		return "font/otf"
	case ".xml":
		return "application/xml"
	case ".pdf":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}
