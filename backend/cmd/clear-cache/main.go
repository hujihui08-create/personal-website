package main

import (
	"context"
	"fmt"
	"log"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
)

func main() {
	fmt.Println("=== Redis 缓存清理工具 ===")

	cfg := config.Load()

	fmt.Println("正在连接 Redis...")
	if err := database.ConnectRedis(cfg.Redis); err != nil {
		log.Fatalf("Redis 连接失败: %v", err)
	}
	fmt.Println("Redis 连接成功")

	ctx := context.Background()
	fmt.Println("\n正在清理预约时段缓存...")
	
	keys, err := database.RedisClient.Keys(ctx, "booking:slots:*").Result()
	if err != nil {
		log.Fatalf("获取缓存键失败: %v", err)
	}

	if len(keys) == 0 {
		fmt.Println("没有找到预约时段缓存")
	} else {
		fmt.Printf("找到 %d 个缓存键，正在删除...\n", len(keys))
		for _, key := range keys {
			if err := database.RedisClient.Del(ctx, key).Err(); err != nil {
				log.Printf("删除缓存键 %s 失败: %v", key, err)
			} else {
				fmt.Printf("已删除: %s\n", key)
			}
		}
	}

	fmt.Println("\n=== 缓存清理完成 ===")
	fmt.Println("预约时段缓存已清理，前端会从数据库重新加载数据")
}
