package handler

import (
	"net/http"
	"strconv"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type AgentConfigHandler struct {
	repo *repository.AgentConfigRepo
}

func NewAgentConfigHandler(repo *repository.AgentConfigRepo) *AgentConfigHandler {
	return &AgentConfigHandler{repo: repo}
}

func (h *AgentConfigHandler) GetCurrent(c *gin.Context) {
	config, err := h.repo.GetCurrent()
	if err != nil {
		// Return default config if none published
		defaultCfg := model.AgentConfigJSON{
			LLM:     model.AgentConfigLLM{Temperature: 0.7, MaxTokens: 2000, TopK: 3},
			Harness: model.AgentConfigHarness{MaxSteps: 5, TimeoutSeconds: 120, LoopStrategy: "react"},
			Tools:   model.AgentConfigTools{Enabled: []string{"create_booking", "query_booking", "cancel_booking"}},
		}
		c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": gin.H{"config": defaultCfg}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": config})
}

func (h *AgentConfigHandler) SaveDraft(c *gin.Context) {
	var req struct {
		Config model.AgentConfigJSON `json:"config" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求格式错误"})
		return
	}
	draft, err := h.repo.SaveDraft(req.Config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "保存失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": draft})
}

func (h *AgentConfigHandler) Publish(c *gin.Context) {
	draft, err := h.repo.GetDraft()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "没有草稿可发布"})
		return
	}
	published, err := h.repo.Publish(draft.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "发布失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": published})
}

func (h *AgentConfigHandler) ListVersions(c *gin.Context) {
	versions, err := h.repo.ListVersions()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": []model.AgentConfig{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": versions})
}

func (h *AgentConfigHandler) Rollback(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}
	config, err := h.repo.Rollback(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": config})
}
