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
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, cfg *config.Config, db *gorm.DB, minioClient *minio.Client, redisClient *redis.Client) {
	// --- Repositories ---
	adminRepo := repository.NewAdminRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	experienceRepo := repository.NewWorkExperienceRepository(db)
	resumeRepo := repository.NewResumeRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	projectPrdRepo := repository.NewProjectPrdRepository(db)
	scheduleSettingRepo := repository.NewScheduleSettingRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	chatSessionRepo := repository.NewChatSessionRepository(db)
	knowledgeDocRepo := repository.NewKnowledgeDocRepository(db)
	configRepo := repository.NewConfigRepository(db)
	agentDebugLogRepo := repository.NewAgentDebugLogRepo(db)
	agentPromptRepo := repository.NewAgentPromptRepo(db)
	prototypeRepo := repository.NewPrototypeRepository(db)
	agentConfigRepo := repository.NewAgentConfigRepo(db)
	agentIntentRepo := repository.NewAgentIntentRepo(db)
	agentToolRepo := repository.NewAgentToolRepo(db)

	// --- Services ---
	emailService := service.NewEmailService(cfg.Email)
	notificationService := service.NewNotificationService(notificationRepo, emailService)
	authService := service.NewAuthService(adminRepo, cfg.JWT)
	profileService := service.NewProfileService(profileRepo, minioClient, cfg)
	experienceService := service.NewExperienceService(experienceRepo)
	resumeService := service.NewResumeService(resumeRepo, minioClient, cfg)
	projectService := service.NewProjectService(projectRepo, projectPrdRepo, minioClient, cfg)
	bookingService := service.NewBookingService(scheduleSettingRepo, bookingRepo, notificationService, db)
	documentParser := service.NewDocumentParser()
	textSplitter := service.NewTextSplitter(512, 50)
	configService := service.NewConfigService(configRepo)
	embeddingService := service.NewEmbeddingService(configService)
	ragService := service.NewRAGService(knowledgeDocRepo, documentParser, textSplitter, embeddingService)
	chatService := service.NewChatService(chatSessionRepo, ragService, configService, redisClient, profileRepo, projectRepo, experienceRepo, agentPromptRepo, bookingService, agentIntentRepo)
	agentDebugService := service.NewAgentDebugService(ragService, embeddingService, configService, agentDebugLogRepo, agentPromptRepo, profileRepo, projectRepo, agentIntentRepo)
	agentPromptService := service.NewAgentPromptService(agentPromptRepo)
	prototypeService := service.NewPrototypeService(prototypeRepo, minioClient, cfg.MinIO.Bucket)
	projectPrdService := service.NewProjectPrdService(projectPrdRepo, prototypeRepo, minioClient, cfg.MinIO.Bucket)

	// --- Handlers ---
	authHandler := handler.NewAuthHandler(authService)
	profileHandler := handler.NewProfileHandler(profileService)
	experienceHandler := handler.NewExperienceHandler(experienceService)
	fileHandler := handler.NewFileHandler(minioClient, cfg.MinIO.Bucket)
	projectHandler := handler.NewProjectHandler(projectService, projectPrdService)
	bookingHandler := handler.NewBookingHandler(bookingService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	agentHandler := handler.NewAgentHandler(chatService)
	knowledgeHandler := handler.NewKnowledgeHandler(ragService)
	configHandler := handler.NewConfigHandler(configService)
	agentDebugHandler := handler.NewAgentDebugHandler(agentDebugService)
	agentPromptHandler := handler.NewAgentPromptHandler(agentPromptService, agentDebugService)
	prototypeHandler := handler.NewPrototypeHandler(prototypeService, minioClient, cfg.MinIO.Bucket)
	agentConfigHandler := handler.NewAgentConfigHandler(agentConfigRepo)
	agentToolsHandler := handler.NewAgentToolsHandler(agentToolRepo)
	agentIntentHandler := handler.NewAgentIntentHandler(agentIntentRepo)

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
			projectsProtected.PUT("/:id/featured", projectHandler.ToggleFeatured)
			projectsProtected.POST("/upload-cover", projectHandler.UploadCoverImage)
			projectsProtected.POST("/upload-image", projectHandler.UploadProjectImage)

			// PRD management under project
			projectsProtected.POST("/:id/prds", projectHandler.CreatePRD)
			projectsProtected.GET("/:id/prds", projectHandler.ListPRDs)
			projectsProtected.PUT("/:id/prds/:prdId", projectHandler.UpdatePRD)
			projectsProtected.DELETE("/:id/prds/:prdId", projectHandler.DeletePRD)
			projectsProtected.PUT("/:id/prds/:prdId/move-up", projectHandler.MovePRDUp)
			projectsProtected.PUT("/:id/prds/:prdId/move-down", projectHandler.MovePRDDown)
		}

		// Booking routes (public)
		bookings := api.Group("/bookings")
		{
			bookings.GET("/slots", bookingHandler.GetSlots)
			bookings.POST("", bookingHandler.CreateBooking)
			bookings.GET("/lookup", bookingHandler.LookupBooking)
			bookings.PUT("/:id/cancel", bookingHandler.CancelBookingByUser)
			bookings.PUT("/:id", bookingHandler.UpdateBookingByUser)
		}

		// Booking management (protected)
		bookingsProtected := api.Group("/bookings")
		bookingsProtected.Use(middleware.AuthMiddleware(authService))
		{
			bookingsProtected.GET("", bookingHandler.ListBookings)
			bookingsProtected.GET("/:id", bookingHandler.GetBooking)
			bookingsProtected.PUT("/:id/status", bookingHandler.UpdateBookingStatus)
		}

		// Schedule settings (protected)
		scheduleProtected := api.Group("/schedule")
		scheduleProtected.Use(middleware.AuthMiddleware(authService))
		{
			scheduleProtected.GET("", bookingHandler.GetScheduleSettings)
			scheduleProtected.PUT("", bookingHandler.UpdateScheduleSettings)
		}

		// Notifications (protected)
		notificationsProtected := api.Group("/notifications")
		notificationsProtected.Use(middleware.AuthMiddleware(authService))
		{
			notificationsProtected.GET("", notificationHandler.GetNotifications)
			notificationsProtected.PUT("/:id/read", notificationHandler.MarkAsRead)
			notificationsProtected.PUT("/read-all", notificationHandler.MarkAllAsRead)
			notificationsProtected.GET("/unread", notificationHandler.GetUnreadCount)
		}

		// Agent (public)
		api.POST("/agent/chat", agentHandler.Chat)
		api.GET("/agent/history", agentHandler.GetHistory)
		api.GET("/agent/sessions", agentHandler.ListSessions)
		api.POST("/agent/clear", agentHandler.ClearSession)

		// Agent Debug (protected)
		agentDebug := api.Group("/agent/debug")
		agentDebug.Use(middleware.AuthMiddleware(authService))
		{
			agentDebug.POST("", agentDebugHandler.DebugChat)
			agentDebug.GET("/history", agentDebugHandler.GetDebugHistory)
			agentDebug.DELETE("/history", agentDebugHandler.DeleteDebugHistory)
			agentDebug.GET("/retrieval", agentDebugHandler.TestRetrieval)
		}

		// Agent Prompts (protected)
		agentPrompts := api.Group("/agent/prompts")
		agentPrompts.Use(middleware.AuthMiddleware(authService))
		{
			agentPrompts.GET("", agentPromptHandler.ListPrompts)
			agentPrompts.GET("/:id", agentPromptHandler.GetPrompt)
			agentPrompts.POST("", agentPromptHandler.CreatePrompt)
			agentPrompts.PUT("/:id", agentPromptHandler.UpdatePrompt)
			agentPrompts.DELETE("/:id", agentPromptHandler.DeletePrompt)
			agentPrompts.PUT("/:id/default", agentPromptHandler.SetDefaultPrompt)
			agentPrompts.POST("/:id/test", agentPromptHandler.TestWithPrompt)
		}

		// Knowledge (protected)
		knowledgeProtected := api.Group("/knowledge")
		knowledgeProtected.Use(middleware.AuthMiddleware(authService))
		{
			knowledgeProtected.GET("", knowledgeHandler.ListDocuments)
			knowledgeProtected.POST("", knowledgeHandler.UploadDocument)
			knowledgeProtected.DELETE("/:id", knowledgeHandler.DeleteDocument)
			knowledgeProtected.POST("/reindex", knowledgeHandler.ReindexAll)
		}

		// Prototype file serving (public) - 保留文件代理
		api.GET("/prototypes/:id/*filepath", prototypeHandler.ServeFile)

		// Config (protected)
		configProtected := api.Group("/config")
		configProtected.Use(middleware.AuthMiddleware(authService))
		{
			configProtected.GET("", configHandler.GetAllConfigs)
			configProtected.GET("/llm", configHandler.GetLLMConfig)
			configProtected.PUT("/llm", configHandler.UpdateLLMConfig)
			configProtected.GET("/embedding", configHandler.GetEmbeddingConfig)
			configProtected.PUT("/embedding", configHandler.UpdateEmbeddingConfig)
		}

		// Admin Agent (protected)
		adminAgent := api.Group("/admin/agent")
		adminAgent.Use(middleware.AuthMiddleware(authService))
		{
			// Tools
			adminAgent.GET("/tools", agentToolsHandler.List)
			adminAgent.PUT("/tools/:name", agentToolsHandler.UpdateActive)

			// Configs
			adminAgent.GET("/configs/current", agentConfigHandler.GetCurrent)
			adminAgent.POST("/configs", agentConfigHandler.SaveDraft)
			adminAgent.POST("/configs/publish", agentConfigHandler.Publish)
			adminAgent.GET("/configs/versions", agentConfigHandler.ListVersions)
			adminAgent.POST("/configs/rollback/:id", agentConfigHandler.Rollback)

			// Intents
			adminAgent.GET("/intents", agentIntentHandler.List)
			adminAgent.POST("/intents", agentIntentHandler.Create)
			adminAgent.PUT("/intents/:id", agentIntentHandler.Update)
			adminAgent.DELETE("/intents/:id", agentIntentHandler.Delete)
			adminAgent.PUT("/intents/sort", agentIntentHandler.UpdateSort)
		}
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Server is running",
	})
}
