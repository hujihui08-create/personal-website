package router

import (
	"net/http"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/handler"
	"portfolio-backend/internal/middleware"
	"portfolio-backend/internal/repository"
	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, cfg *config.Config, db *gorm.DB) {
	adminRepo := repository.NewAdminRepository(db)
	authService := service.NewAuthService(adminRepo, cfg.JWT)
	authHandler := handler.NewAuthHandler(authService)

	api := r.Group("/api")
	{
		api.GET("/health", healthCheck)

		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(authService), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(authService), authHandler.Me)
		}
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Server is running",
	})
}
