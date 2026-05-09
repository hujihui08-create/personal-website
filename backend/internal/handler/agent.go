package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AgentHandler struct {
	chatService *service.ChatService
}

func NewAgentHandler(chatService *service.ChatService) *AgentHandler {
	return &AgentHandler{chatService: chatService}
}

type ChatRequest struct {
	Message   string `json:"message" binding:"required"`
	SessionID string `json:"session_id"`
	Stream    bool   `json:"stream"`
}

func (h *AgentHandler) Chat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	userID := c.ClientIP()
	allowed, err := h.chatService.CheckDailyLimit(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "服务器错误",
		})
		return
	}

	if !allowed {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"code":    429,
			"message": "今日使用次数已达上限",
		})
		return
	}

	session, err := h.chatService.GetOrCreateSession(req.SessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "会话创建失败",
		})
		return
	}

	if !req.Stream {
		c.JSON(http.StatusOK, gin.H{
			"code":    400,
			"message": "暂不支持非流式响应",
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	h.chatService.IncrementDailyCount(userID)

	ctx := c.Request.Context()
	respChan, err := h.chatService.ChatStream(ctx, session, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "对话失败",
		})
		return
	}

	c.Stream(func(w io.Writer) bool {
		for msg := range respChan {
			data, err := json.Marshal(msg)
			if err == nil {
				w.Write([]byte("data: "))
				w.Write(data)
				w.Write([]byte("\n\n"))
				if flusher, ok := w.(http.Flusher); ok {
					flusher.Flush()
				}
			}
		}
		return false
	})
}

func (h *AgentHandler) GetHistory(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "session_id 不能为空",
		})
		return
	}

	history, err := h.chatService.GetSessionHistory(sessionID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "success",
			"data": gin.H{
				"session_id": sessionID,
				"messages":   []any{},
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    history,
	})
}

func (h *AgentHandler) ClearSession(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
		})
		return
	}

	if err := h.chatService.ClearSession(req.SessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "清除会话失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}
