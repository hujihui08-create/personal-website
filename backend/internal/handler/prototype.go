package handler

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

// PrototypeHandler 原型项目管理处理器
type PrototypeHandler struct {
	protoService *service.PrototypeService
	minioClient  *minio.Client
	bucket       string
}

// NewPrototypeHandler 创建 PrototypeHandler 实例
func NewPrototypeHandler(protoService *service.PrototypeService, minioClient *minio.Client, bucket string) *PrototypeHandler {
	return &PrototypeHandler{
		protoService: protoService,
		minioClient:  minioClient,
		bucket:       bucket,
	}
}

// List 获取所有原型项目列表
func (h *PrototypeHandler) List(c *gin.Context) {
	prototypes, err := h.protoService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取原型列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prototypes,
	})
}

// Upload 上传并解压原型 zip 包
func (h *PrototypeHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请上传文件",
		})
		return
	}
	defer file.Close()

	name := c.PostForm("name")
	if name == "" {
		// 用文件名（去掉 .zip 后缀）作为名称
		name = strings.TrimSuffix(header.Filename, ".zip")
		name = strings.TrimSuffix(name, ".ZIP")
	}

	prototype, err := h.protoService.Upload(file, header, name)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prototype,
	})
}

// Delete 删除原型项目（包括 MinIO 文件与数据库记录）
func (h *PrototypeHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的原型ID",
		})
		return
	}

	if err := h.protoService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

// ServeFile 从 MinIO 获取原型项目的静态文件并返回
// 这是公开路由，不需要认证，用于浏览器加载原型页面及其依赖资源
func (h *PrototypeHandler) ServeFile(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的原型ID",
		})
		return
	}

	filePath := c.Param("filepath")
	// Gin 的 *filepath 参数会包含前缀 `/`，去除之
	filePath = strings.TrimPrefix(filePath, "/")

	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件路径不能为空",
		})
		return
	}

	// 构造 MinIO 对象路径：prototypes/{id}/{filepath}
	objectName := fmt.Sprintf("prototypes/%d/%s", id, filePath)

	ctx := context.Background()

	// 先检查对象是否存在
	_, err = h.minioClient.StatObject(ctx, h.bucket, objectName, minio.StatObjectOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "文件不存在",
		})
		return
	}

	// 获取对象
	obj, err := h.minioClient.GetObject(ctx, h.bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取文件失败",
		})
		return
	}
	defer obj.Close()

	// 根据扩展名设置 Content-Type
	contentType := detectContentTypeForPrototype(filePath)
	c.Header("Content-Type", contentType)

	// 流式传输文件内容
	if _, err := io.Copy(c.Writer, obj); err != nil {
		return
	}
}

// detectContentTypeForPrototype 根据文件名后缀返回 MIME 类型
func detectContentTypeForPrototype(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".html", ".htm":
		return "text/html; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
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
		return "application/xml; charset=utf-8"
	case ".pdf":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}
