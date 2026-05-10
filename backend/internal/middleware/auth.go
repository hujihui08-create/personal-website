package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthServiceInterface defines the methods needed from the auth service.
// Defined locally to avoid circular dependencies with the handler package.
type AuthServiceInterface interface {
	ValidateToken(tokenString string) (uint, error)
}

func AuthMiddleware(authService AuthServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "缺少认证Token",
			}})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		adminID, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Token无效或已过期",
			}})
			c.Abort()
			return
		}

		c.Set("admin_id", adminID)
		c.Next()
	}
}
