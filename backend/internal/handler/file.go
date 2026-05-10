package handler

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

type FileHandler struct {
	minioClient *minio.Client
	bucket      string
}

func NewFileHandler(minioClient *minio.Client, bucket string) *FileHandler {
	return &FileHandler{
		minioClient: minioClient,
		bucket:      bucket,
	}
}

// GetFile 从 MinIO 获取文件并提供下载
func (h *FileHandler) GetFile(c *gin.Context) {
	filepath := c.Param("filepath")

	// 去掉 Gin *filepath 参数自带的前导斜杠，使路径与 MinIO 对象路径一致
	filepath = strings.TrimPrefix(filepath, "/")

	if filepath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件路径不能为空",
			"data":    nil,
		})
		return
	}

	if h.minioClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "文件服务未配置",
			"data":    nil,
		})
		return
	}

	// 从路径中提取文件名
	parts := strings.Split(filepath, "/")
	filename := parts[len(parts)-1]

	ctx := context.Background()

	// 获取对象信息
	objectInfo, err := h.minioClient.StatObject(ctx, h.bucket, filepath, minio.StatObjectOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "文件不存在",
			"data":    nil,
		})
		return
	}

	// 根据 Content-Type 决定展示方式：图片展示为 inline，其他为 attachment 下载
	contentType := objectInfo.ContentType
	disposition := "inline"
	if !strings.HasPrefix(contentType, "image/") {
		disposition = fmt.Sprintf("attachment; filename=\"%s\"", filename)
	}

	c.Header("Content-Disposition", disposition)
	c.Header("Content-Type", contentType)

	// 获取对象数据
	obj, err := h.minioClient.GetObject(ctx, h.bucket, filepath, minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取文件失败",
			"data":    nil,
		})
		return
	}
	defer obj.Close()

	// 流式传输文件内容
	if _, err := io.Copy(c.Writer, obj); err != nil {
		return
	}
}
