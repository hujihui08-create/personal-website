package handler

import (
	"net/http"
	"strconv"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AgentDebugHandler struct {
	debugService *service.AgentDebugService
}

func NewAgentDebugHandler(debugService *service.AgentDebugService) *AgentDebugHandler {
	return &AgentDebugHandler{debugService: debugService}
}

type DebugChatRequest struct {
	Message        string `json:"message" binding:"required"`
	AgentType      string `json:"agent_type"`
	ShowRetrieval  bool   `json:"show_retrieval"`
	ShowPrompt     bool   `json:"show_prompt"`
	CustomPromptID *uint  `json:"custom_prompt_id"`
}

func (h *AgentDebugHandler) DebugChat(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未登录",
		})
		return
	}

	var req DebugChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	resp, err := h.debugService.DebugChat(adminID.(uint), req.Message, req.AgentType, req.ShowRetrieval, req.ShowPrompt, req.CustomPromptID)
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

func (h *AgentDebugHandler) GetDebugHistory(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未登录",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	history, total, err := h.debugService.GetDebugHistory(adminID.(uint), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取调试历史失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data": gin.H{
			"list":      history,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *AgentDebugHandler) DeleteDebugHistory(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未登录",
		})
		return
	}

	idStr := c.Query("id")
	if idStr != "" {
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "无效的调试记录ID",
			})
			return
		}
		uid := uint(id)
		count, err := h.debugService.DeleteDebugHistory(adminID.(uint), &uid)
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
			"data":    gin.H{"deleted": count},
		})
		return
	}

	// 删除全部
	count, err := h.debugService.DeleteDebugHistory(adminID.(uint), nil)
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
		"data":    gin.H{"deleted": count},
	})
}

func (h *AgentDebugHandler) TestRetrieval(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "query 参数不能为空",
		})
		return
	}

	topK, _ := strconv.Atoi(c.DefaultQuery("top_k", "3"))
	if topK <= 0 {
		topK = 3
	}

	resp, err := h.debugService.TestRetrieval(query, topK)
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
