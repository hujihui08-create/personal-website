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
	"portfolio-backend/internal/router"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
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

	// Auto-migrate database models
	if err := db.AutoMigrate(
		&model.Admin{},
		&model.Project{},
		&model.Profile{},
		&model.WorkExperience{},
		&model.ExperienceProject{},
		&model.Resume{},
	); err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
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

	router.Setup(r, cfg, db, minioClient)

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
