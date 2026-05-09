package handler

import (
	"net/http"
	"strconv"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
)

const maxFileSize = 10 * 1024 * 1024 // 10MB

type KnowledgeHandler struct {
	ragService *service.RAGService
}

func NewKnowledgeHandler(ragService *service.RAGService) *KnowledgeHandler {
	return &KnowledgeHandler{ragService: ragService}
}

func (h *KnowledgeHandler) ListDocuments(c *gin.Context) {
	docs, err := h.ragService.ListDocuments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取文档列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    docs,
	})
}

func (h *KnowledgeHandler) UploadDocument(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请上传文件",
		})
		return
	}

	// 检查文件大小
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件大小超过限制（最大10MB）",
		})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "文件打开失败",
		})
		return
	}
	defer f.Close()

	if err := h.ragService.UploadDocument(file.Filename, f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

func (h *KnowledgeHandler) DeleteDocument(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的文档ID",
		})
		return
	}

	if err := h.ragService.DeleteDocument(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除文档失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

func (h *KnowledgeHandler) ReindexAll(c *gin.Context) {
	if err := h.ragService.ReindexAll(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "重新索引失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}
