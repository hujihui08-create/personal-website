package handler

import (
	"net/http"
	"strconv"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AgentPromptHandler struct {
	promptService *service.AgentPromptService
	debugService  *service.AgentDebugService
}

func NewAgentPromptHandler(promptService *service.AgentPromptService, debugService *service.AgentDebugService) *AgentPromptHandler {
	return &AgentPromptHandler{
		promptService: promptService,
		debugService:  debugService,
	}
}

func (h *AgentPromptHandler) ListPrompts(c *gin.Context) {
	agentType := c.Query("agent_type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	prompts, total, err := h.promptService.ListPrompts(agentType, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取 Prompt 列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data": gin.H{
			"list":      prompts,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *AgentPromptHandler) GetPrompt(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 Prompt ID",
		})
		return
	}

	prompt, err := h.promptService.GetPrompt(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Prompt 不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prompt,
	})
}

func (h *AgentPromptHandler) CreatePrompt(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未登录",
		})
		return
	}

	var req service.PromptCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	prompt, err := h.promptService.CreatePrompt(adminID.(uint), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建 Prompt 失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prompt,
	})
}

func (h *AgentPromptHandler) UpdatePrompt(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 Prompt ID",
		})
		return
	}

	var req service.PromptUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	prompt, err := h.promptService.UpdatePrompt(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新 Prompt 失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prompt,
	})
}

func (h *AgentPromptHandler) DeletePrompt(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 Prompt ID",
		})
		return
	}

	if err := h.promptService.DeletePrompt(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除 Prompt 失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

func (h *AgentPromptHandler) SetDefaultPrompt(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 Prompt ID",
		})
		return
	}

	// 获取 Prompt 以确定 agent_type
	prompt, err := h.promptService.GetPrompt(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Prompt 不存在",
		})
		return
	}

	if err := h.promptService.SetDefaultPrompt(prompt.AgentType, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "设置默认 Prompt 失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

func (h *AgentPromptHandler) TestWithPrompt(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未登录",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 Prompt ID",
		})
		return
	}
	pid := uint(id)

	var req struct {
		Message       string `json:"message" binding:"required"`
		AgentType     string `json:"agent_type"`
		ShowRetrieval bool   `json:"show_retrieval"`
		ShowPrompt    bool   `json:"show_prompt"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	resp, err := h.debugService.DebugChat(adminID.(uint), req.Message, req.AgentType, req.ShowRetrieval, req.ShowPrompt, &pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    resp,
	})
}
