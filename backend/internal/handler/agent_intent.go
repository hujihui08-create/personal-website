package handler

import (
	"net/http"
	"strconv"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type AgentIntentHandler struct {
	repo *repository.AgentIntentRepo
}

func NewAgentIntentHandler(repo *repository.AgentIntentRepo) *AgentIntentHandler {
	return &AgentIntentHandler{repo: repo}
}

func (h *AgentIntentHandler) List(c *gin.Context) {
	intents, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": []model.AgentIntent{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": intents})
}

func (h *AgentIntentHandler) Create(c *gin.Context) {
	var intent model.AgentIntent
	if err := c.ShouldBindJSON(&intent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求格式错误"})
		return
	}
	if err := h.repo.Create(&intent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": intent})
}

func (h *AgentIntentHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求格式错误"})
		return
	}

	intent, err := h.repo.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "意图不存在"})
		return
	}

	// Apply allowed updates
	if v, ok := updates["name"]; ok {
		intent.Name = v.(string)
	}
	if v, ok := updates["label"]; ok {
		intent.Label = v.(string)
	}
	if v, ok := updates["keywords"]; ok {
		intent.Keywords = v.(string)
	}
	if v, ok := updates["sort_order"]; ok {
		intent.SortOrder = int(v.(float64))
	}
	if v, ok := updates["prompt_id"]; ok {
		if v == nil {
			intent.PromptID = nil
		} else {
			id := uint(v.(float64))
			intent.PromptID = &id
		}
	}
	if v, ok := updates["is_active"]; ok {
		intent.IsActive = v.(bool)
	}

	if err := h.repo.Update(intent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success", "data": intent})
}

func (h *AgentIntentHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误"})
		return
	}
	if err := h.repo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success"})
}

func (h *AgentIntentHandler) UpdateSort(c *gin.Context) {
	var req struct {
		Intents []struct {
			ID        uint `json:"id"`
			SortOrder int  `json:"sort_order"`
		} `json:"intents" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求格式错误"})
		return
	}
	for _, item := range req.Intents {
		if err := h.repo.UpdateSortOrder(item.ID, item.SortOrder); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "排序更新失败"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "success"})
}
