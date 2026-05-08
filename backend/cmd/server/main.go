package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/router"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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

	router.Setup(r, cfg, db)

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
