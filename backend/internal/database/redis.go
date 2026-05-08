package database

import (
	"context"
	"fmt"

	"portfolio-backend/internal/config"
	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis(cfg config.RedisConfig) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     cfg.Address(),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx := context.Background()
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return nil
}

func CloseRedis() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}
