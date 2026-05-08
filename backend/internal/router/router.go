package router

import (
	"net/http"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/handler"
	"portfolio-backend/internal/middleware"
	"portfolio-backend/internal/repository"
	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, cfg *config.Config, db *gorm.DB, minioClient *minio.Client) {
	// --- Repositories ---
	adminRepo := repository.NewAdminRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	experienceRepo := repository.NewWorkExperienceRepository(db)
	resumeRepo := repository.NewResumeRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	// --- Services ---
	authService := service.NewAuthService(adminRepo, cfg.JWT)
	profileService := service.NewProfileService(profileRepo, minioClient, cfg)
	experienceService := service.NewExperienceService(experienceRepo)
	resumeService := service.NewResumeService(resumeRepo, minioClient, cfg)
	projectService := service.NewProjectService(projectRepo, minioClient, cfg)

	// --- Handlers ---
	authHandler := handler.NewAuthHandler(authService)
	profileHandler := handler.NewProfileHandler(profileService)
	experienceHandler := handler.NewExperienceHandler(experienceService)
	fileHandler := handler.NewFileHandler(minioClient, cfg.MinIO.Bucket)
	projectHandler := handler.NewProjectHandler(projectService)

	api := r.Group("/api")
	{
		api.GET("/health", healthCheck)

		// File routes (公开，用于下载简历和头像)
		api.GET("/files/*filepath", fileHandler.GetFile)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(authService), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(authService), authHandler.Me)
		}

		// Profile routes
		profile := api.Group("/profile")
		{
			profile.GET("", profileHandler.GetProfile)
			profile.PUT("", middleware.AuthMiddleware(authService), profileHandler.UpdateProfile)
			profile.POST("/avatar", middleware.AuthMiddleware(authService), profileHandler.UploadAvatar)
		}

		// Work experience routes
		experiences := api.Group("/experiences")
		{
			experiences.GET("", experienceHandler.List)
			experiences.POST("", middleware.AuthMiddleware(authService), experienceHandler.Create)
			experiences.PUT("/reorder", middleware.AuthMiddleware(authService), experienceHandler.Reorder)
			experiences.PUT("/:id", middleware.AuthMiddleware(authService), experienceHandler.Update)
			experiences.DELETE("/:id", middleware.AuthMiddleware(authService), experienceHandler.Delete)
		}

		// Resume routes
		resume := api.Group("/resume")
		{
			resume.GET("", func(c *gin.Context) {
				resumeData, err := resumeService.GetResume()
				if err != nil {
					c.JSON(http.StatusOK, gin.H{
						"code":    200,
						"message": "success",
						"data":    nil,
					})
					return
				}
				c.JSON(http.StatusOK, gin.H{
					"code":    200,
					"message": "success",
					"data":    resumeData,
				})
			})
			resume.POST("", middleware.AuthMiddleware(authService), func(c *gin.Context) {
				file, header, err := c.Request.FormFile("file")
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"code":    400,
						"message": "请上传文件",
						"data":    nil,
					})
					return
				}
				defer file.Close()

				resumeData, err := resumeService.UploadResume(file, header)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"code":    500,
						"message": "上传简历失败",
						"data":    nil,
					})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"code":    200,
					"message": "success",
					"data":    resumeData,
				})
			})
		}

		// Project routes (public)
		projects := api.Group("/projects")
		{
			projects.GET("", projectHandler.List)
			projects.GET("/featured", projectHandler.ListFeatured)
			projects.GET("/:id", projectHandler.GetByID)
		}

		// Project routes (protected)
		projectsProtected := api.Group("/projects")
		projectsProtected.Use(middleware.AuthMiddleware(authService))
		{
			projectsProtected.POST("", projectHandler.Create)
			projectsProtected.PUT("/:id", projectHandler.Update)
			projectsProtected.DELETE("/:id", projectHandler.Delete)
			projectsProtected.PUT("/reorder", projectHandler.Reorder)
			projectsProtected.POST("/upload-cover", projectHandler.UploadCoverImage)
			projectsProtected.POST("/upload-image", projectHandler.UploadProjectImage)
		}
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Server is running",
	})
}
