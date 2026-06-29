package service

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/minio/minio-go/v7"
)

const (
	maxPrdZipSize = 20 * 1024 * 1024 // 20MB
)

type ProjectPrdService struct {
	prdRepo        *repository.ProjectPrdRepository
	prototypeRepo  *repository.PrototypeRepository
	minioClient    *minio.Client
	bucket         string
}

func NewProjectPrdService(
	prdRepo *repository.ProjectPrdRepository,
	prototypeRepo *repository.PrototypeRepository,
	minioClient *minio.Client,
	bucket string,
) *ProjectPrdService {
	return &ProjectPrdService{
		prdRepo:       prdRepo,
		prototypeRepo: prototypeRepo,
		minioClient:    minioClient,
		bucket:         bucket,
	}
}

// Create 创建项目 PRD，可选上传原型 zip 包
func (s *ProjectPrdService) Create(
	projectID uint,
	name string,
	prdURL string,
	zipFile multipart.File,
	zipHeader *multipart.FileHeader,
) (*model.ProjectPrd, error) {
	var prototypeID *uint

	// 如果有 zip 文件，先处理原型上传
	if zipFile != nil && zipHeader != nil {
		// 校验文件类型必须是 .zip
		if !strings.HasSuffix(strings.ToLower(zipHeader.Filename), ".zip") {
			return nil, fmt.Errorf("只支持 .zip 格式的文件")
		}

		// 校验文件大小不超过 20MB
		if zipHeader.Size > maxPrdZipSize {
			return nil, fmt.Errorf("文件大小超过限制（最大 20MB）")
		}

		// 读取 zip 内容
		zipData, err := io.ReadAll(zipFile)
		if err != nil {
			return nil, fmt.Errorf("读取 zip 文件失败: %w", err)
		}

		// 解压并校验必须包含 index.html
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

		// 创建 Prototype 数据库记录
		prototype := &model.Prototype{
			Name: name,
		}
		if err := s.prototypeRepo.Create(prototype); err != nil {
			return nil, fmt.Errorf("创建原型记录失败: %w", err)
		}

		// 上传文件到 MinIO
		ctx := context.Background()
		for _, f := range zipReader.File {
			if f.FileInfo().IsDir() {
				continue
			}

			objectName := fmt.Sprintf("prototypes/%d/%s", prototype.ID, f.Name)

			rc, err := f.Open()
			if err != nil {
				s.prototypeRepo.Delete(prototype.ID)
				return nil, fmt.Errorf("打开 zip 内文件 %s 失败: %w", f.Name, err)
			}

			fileData, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				s.prototypeRepo.Delete(prototype.ID)
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
				s.prototypeRepo.Delete(prototype.ID)
				return nil, fmt.Errorf("上传文件 %s 到 MinIO 失败: %w", f.Name, err)
			}
		}

		// 更新原型文件计数和存储前缀
		prototype.FileCount = fileCount
		prototype.StoragePrefix = fmt.Sprintf("prototypes/%d/", prototype.ID)
		if err := s.prototypeRepo.Update(prototype); err != nil {
			return nil, fmt.Errorf("更新原型文件计数失败: %w", err)
		}

		pid := prototype.ID
		prototypeID = &pid
	}

	// 获取最大 sort_order + 1
	maxSort, err := s.prdRepo.GetMaxSortOrder(projectID)
	if err != nil {
		return nil, fmt.Errorf("获取排序序号失败: %w", err)
	}

	prd := &model.ProjectPrd{
		ProjectID:   projectID,
		Name:        name,
		PrdURL:      prdURL,
		PrototypeID: prototypeID,
		SortOrder:   maxSort + 1,
	}

	if err := s.prdRepo.Create(prd); err != nil {
		return nil, fmt.Errorf("创建 PRD 记录失败: %w", err)
	}

	// 重新加载以获取关联数据
	return s.prdRepo.FindByID(prd.ID)
}

// List 获取项目的所有 PRD
func (s *ProjectPrdService) List(projectID uint) ([]model.ProjectPrd, error) {
	return s.prdRepo.FindByProjectID(projectID)
}

// Update 更新 PRD 的名称和 URL
func (s *ProjectPrdService) Update(id uint, name string, prdURL string) error {
	prd, err := s.prdRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("PRD 不存在: %w", err)
	}

	prd.Name = name
	prd.PrdURL = prdURL

	return s.prdRepo.Update(prd)
}

// Delete 删除 PRD，同时删除关联的原型（含 MinIO 清理）
func (s *ProjectPrdService) Delete(id uint) error {
	prd, err := s.prdRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("PRD 不存在: %w", err)
	}

	// 删除关联的原型
	if prd.PrototypeID != nil {
		if err := s.deletePrototypeWithMinIO(*prd.PrototypeID); err != nil {
			return fmt.Errorf("删除关联原型失败: %w", err)
		}
	}

	// 删除 PRD 记录
	if err := s.prdRepo.Delete(id); err != nil {
		return fmt.Errorf("删除 PRD 记录失败: %w", err)
	}

	return nil
}

// deletePrototypeWithMinIO 删除原型记录及其 MinIO 文件
func (s *ProjectPrdService) deletePrototypeWithMinIO(prototypeID uint) error {
	// 获取原型记录
	prototype, err := s.prototypeRepo.FindByID(prototypeID)
	if err != nil {
		return fmt.Errorf("原型不存在: %w", err)
	}

	// 删除 MinIO 中 prototypes/{id}/ 前缀下的所有文件
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

	// 删除数据库记录
	if err := s.prototypeRepo.Delete(prototype.ID); err != nil {
		return fmt.Errorf("删除原型数据库记录失败: %w", err)
	}

	return nil
}

// MoveUp 将 PRD 与上一条交换 sort_order
func (s *ProjectPrdService) MoveUp(id uint) error {
	prd, err := s.prdRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("PRD 不存在: %w", err)
	}

	// 查找同一 project 中 sort_order 小于当前 PRD 的最大值（即上一条）
	prds, err := s.prdRepo.FindByProjectID(prd.ProjectID)
	if err != nil {
		return fmt.Errorf("获取 PRD 列表失败: %w", err)
	}

	var prev *model.ProjectPrd
	for i := range prds {
		if prds[i].ID == id {
			if i > 0 {
				prev = &prds[i-1]
			}
			break
		}
	}

	if prev == nil {
		return fmt.Errorf("已经是第一条，无法上移")
	}

	// 交换 sort_order
	prdSort := prd.SortOrder
	if err := s.prdRepo.UpdateSortOrder(prd.ID, prev.SortOrder); err != nil {
		return fmt.Errorf("更新排序失败: %w", err)
	}
	if err := s.prdRepo.UpdateSortOrder(prev.ID, prdSort); err != nil {
		return fmt.Errorf("更新排序失败: %w", err)
	}

	return nil
}

// MoveDown 将 PRD 与下一条交换 sort_order
func (s *ProjectPrdService) MoveDown(id uint) error {
	prd, err := s.prdRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("PRD 不存在: %w", err)
	}

	prds, err := s.prdRepo.FindByProjectID(prd.ProjectID)
	if err != nil {
		return fmt.Errorf("获取 PRD 列表失败: %w", err)
	}

	var next *model.ProjectPrd
	for i := range prds {
		if prds[i].ID == id {
			if i < len(prds)-1 {
				next = &prds[i+1]
			}
			break
		}
	}

	if next == nil {
		return fmt.Errorf("已经是最后一条，无法下移")
	}

	// 交换 sort_order
	prdSort := prd.SortOrder
	if err := s.prdRepo.UpdateSortOrder(prd.ID, next.SortOrder); err != nil {
		return fmt.Errorf("更新排序失败: %w", err)
	}
	if err := s.prdRepo.UpdateSortOrder(next.ID, prdSort); err != nil {
		return fmt.Errorf("更新排序失败: %w", err)
	}

	return nil
}


