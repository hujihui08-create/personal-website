package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
	"portfolio-backend/internal/router"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	if err := database.ConnectRedis(cfg.Redis); err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
	}

	// Initialize MinIO client
	minioClient, err := minio.New(cfg.MinIO.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIO.AccessKeyID, cfg.MinIO.SecretAccessKey, ""),
		Secure: cfg.MinIO.UseSSL,
	})
	if err != nil {
		log.Printf("Warning: Failed to initialize MinIO client: %v", err)
	}

	// Enable vector extension before auto-migration (needed for vector column type)
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS vector").Error; err != nil {
		log.Printf("Warning: Failed to create vector extension: %v", err)
	}

	// Auto-migrate database models
	if err := db.AutoMigrate(
		&model.Admin{},
		&model.Project{},
		&model.Profile{},
		&model.WorkExperience{},
		&model.ExperienceProject{},
		&model.Resume{},
		&model.ScheduleSetting{},
		&model.Booking{},
		&model.Notification{},
		&model.ChatSession{},
		&model.KnowledgeDoc{},
		&model.Config{},
	); err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	// Create vector index for similarity search
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_docs_embedding ON knowledge_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)").Error; err != nil {
		log.Printf("Warning: Failed to create vector index: %v", err)
	}

	// Initialize default configurations
	if err := initDefaultConfigs(db); err != nil {
		log.Printf("Warning: Failed to initialize default configs: %v", err)
	}

	// Ensure MinIO bucket exists
	if minioClient != nil {
		ctx := context.Background()
		bucketName := cfg.MinIO.Bucket
		exists, err := minioClient.BucketExists(ctx, bucketName)
		if err != nil {
			log.Printf("Warning: Failed to check MinIO bucket: %v", err)
		} else if !exists {
			if err := minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{}); err != nil {
				log.Printf("Warning: Failed to create MinIO bucket: %v", err)
			}
		}
	}

	defer func() {
		if err := database.Close(db); err != nil {
			log.Printf("Failed to close database connection: %v", err)
		}
		if err := database.CloseRedis(); err != nil {
			log.Printf("Failed to close Redis connection: %v", err)
		}
	}()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	corsConfig := cors.Config{
		AllowOrigins:     []string{cfg.CORS.AllowedOrigins},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	router.Setup(r, cfg, db, minioClient, database.RedisClient)

	go func() {
		log.Printf("Server starting on %s", cfg.Server.Address)
		if err := r.Run(cfg.Server.Address); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}

func initDefaultConfigs(db *gorm.DB) error {
	configRepo := repository.NewConfigRepository(db)

	// 从环境变量读取配置，如果没有则使用默认值
	getEnv := func(key, defaultValue string) string {
		if v := os.Getenv(key); v != "" {
			return v
		}
		return defaultValue
	}

	// 先删除所有旧的配置
	log.Println("Clearing old configurations...")
	if err := db.Exec("DELETE FROM configs").Error; err != nil {
		log.Printf("Warning: Failed to clear old configs: %v", err)
	}

	defaultConfigs := []struct {
		key      string
		value    string
		category string
	}{
		{"llm.provider", getEnv("LLM_PROVIDER", "openai"), "llm"},
		{"llm.api_key", getEnv("LLM_API_KEY", ""), "llm"},
		{"llm.base_url", getEnv("LLM_BASE_URL", ""), "llm"},
		{"llm.model", getEnv("LLM_MODEL", "deepseek-chat"), "llm"},
		{"llm.temperature", getEnv("LLM_TEMPERATURE", "0.7"), "llm"},
		{"llm.max_tokens", getEnv("LLM_MAX_TOKENS", "2000"), "llm"},
		{"embedding.provider", getEnv("LLM_PROVIDER", "openai"), "embedding"},
		{"embedding.api_key", getEnv("LLM_API_KEY", ""), "embedding"},
		{"embedding.base_url", getEnv("LLM_BASE_URL", ""), "embedding"},
		{"embedding.model", getEnv("LLM_EMBEDDING_MODEL", "text-embedding-3-small"), "embedding"},
	}

	for _, cfg := range defaultConfigs {
		if err := configRepo.Upsert(cfg.key, cfg.value, cfg.category); err != nil {
			log.Printf("Warning: Failed to upsert config %s: %v", cfg.key, err)
		} else {
			log.Printf("Config %s set to: %s", cfg.key, cfg.value)
		}
	}

	log.Println("Default configurations initialized successfully")
	return nil
}
