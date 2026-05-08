package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"time"

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

func writeDebugLog(runID, hypothesisID, location, message string, data map[string]any) {
	payload := map[string]any{
		"sessionId":    "eec9a5",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     location,
		"message":      message,
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	f, err := os.OpenFile("C:\\Users\\Chzy1\\Desktop\\个人网站\\debug-eec9a5.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	_, _ = f.Write(append(b, '\n'))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	// #region agent log
	writeDebugLog(
		"run1",
		"H2_non_json_content_type",
		"backend/internal/handler/auth.go:Login:before_bind",
		"login request received before json bind",
		map[string]any{
			"contentType":   c.GetHeader("Content-Type"),
			"contentLength": c.Request.ContentLength,
		},
	)
	// #endregion
	if err := c.ShouldBindJSON(&req); err != nil {
		// #region agent log
		writeDebugLog(
			"run1",
			"H1_payload_shape_invalid_or_empty",
			"backend/internal/handler/auth.go:Login:bind_error",
			"json bind failed for login",
			map[string]any{
				"error": err.Error(),
			},
		)
		// #endregion
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{
			"code":    "INVALID_REQUEST",
			"message": "请求格式错误",
		}})
		return
	}
	// #region agent log
	writeDebugLog(
		"run1",
		"H3_empty_password_fails_required_binding",
		"backend/internal/handler/auth.go:Login:bind_ok",
		"json bind succeeded for login",
		map[string]any{
			"passwordLength": len(req.Password),
		},
	)
	// #endregion

	result, err := h.authService.Login(req.Password)
	if err != nil {
		// #region agent log
		writeDebugLog(
			"run1",
			"H4_auth_service_error_misread_as_format_error",
			"backend/internal/handler/auth.go:Login:service_error",
			"auth service returned error",
			map[string]any{
				"error": err.Error(),
			},
		)
		// #endregion
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
		if errors.Is(err, service.ErrAdminNotFound) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": gin.H{
				"code":    "ADMIN_NOT_INITIALIZED",
				"message": "管理员未初始化，请先执行数据库种子数据",
			}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "服务器内部错误",
		}})
		return
	}
	// #region agent log
	writeDebugLog(
		"run1",
		"H4_auth_service_error_misread_as_format_error",
		"backend/internal/handler/auth.go:Login:success",
		"auth service login succeeded",
		map[string]any{
			"expiresAt": result.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	)
	// #endregion

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
