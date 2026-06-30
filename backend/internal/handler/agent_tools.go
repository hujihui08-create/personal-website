package handler

import (
	"net/http"

	"portfolio-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type AgentToolsHandler struct {
	repo *repository.AgentToolRepo
}

func NewAgentToolsHandler(repo *repository.AgentToolRepo) *AgentToolsHandler {
	return &AgentToolsHandler{repo: repo}
}

func (h *AgentToolsHandler) List(c *gin.Context) {
	tools, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": []any{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": tools})
}

func (h *AgentToolsHandler) UpdateActive(c *gin.Context) {
	name := c.Param("name")
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求格式错误"})
		return
	}
	if err := h.repo.UpdateActive(name, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success"})
}
