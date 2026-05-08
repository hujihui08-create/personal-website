package handler

import (
	"errors"
	"net/http"

	"portfolio-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type LoginRequest struct {
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{
			"code":    "INVALID_REQUEST",
			"message": "请求格式错误",
		}})
		return
	}

	result, err := h.authService.Login(req.Password)
	if err != nil {
		if errors.Is(err, service.ErrRateLimited) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": gin.H{
				"code":    "RATE_LIMITED",
				"message": err.Error(),
			}})
			return
		}
		if errors.Is(err, service.ErrInvalidPassword) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "密码错误",
			}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "服务器内部错误",
		}})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token:     result.Token,
		ExpiresAt: result.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "已登出",
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
			"code":    "UNAUTHORIZED",
			"message": "未登录",
		}})
		return
	}

	admin, err := h.authService.GetAdmin(adminID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "获取用户信息失败",
		}})
		return
	}

	c.JSON(http.StatusOK, admin)
}
