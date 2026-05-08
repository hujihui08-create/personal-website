package main

import (
	"fmt"
	"log"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"
)

func main() {
	fmt.Println("=== 预约时段初始化工具 ===")

	cfg := config.Load()

	fmt.Println("正在连接数据库...")
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	fmt.Println("数据库连接成功")

	fmt.Println("\n正在自动创建数据库表...")
	if err := db.AutoMigrate(&model.ScheduleSetting{}, &model.Booking{}); err != nil {
		log.Fatalf("创建数据库表失败: %v", err)
	}
	fmt.Println("数据库表创建成功")

	fmt.Println("\n正在检查现有时段设置...")
	var count int64
	if err := db.Model(&model.ScheduleSetting{}).Count(&count).Error; err != nil {
		log.Fatalf("检查时段设置失败: %v", err)
	}

	if count > 0 {
		fmt.Printf("数据库中已有 %d 条时段设置记录，正在清理...", count)
		fmt.Println("\n正在删除现有设置...")
		if err := db.Exec("DELETE FROM schedule_settings").Error; err != nil {
			log.Fatalf("删除现有设置失败: %v", err)
		}
		fmt.Println("删除成功")
	}

	fmt.Println("\n正在插入默认时段设置...")

	settings := []model.ScheduleSetting{
		// Monday (1)
		{Weekday: 1, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 1, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 1, StartTime: "11:00", EndTime: "12:00", IsActive: true},
		{Weekday: 1, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 1, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		// Tuesday (2)
		{Weekday: 2, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 2, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 2, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 2, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 2, StartTime: "16:00", EndTime: "17:00", IsActive: true},
		// Wednesday (3)
		{Weekday: 3, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 3, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 3, StartTime: "11:00", EndTime: "12:00", IsActive: true},
		{Weekday: 3, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 3, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		// Thursday (4)
		{Weekday: 4, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 4, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 4, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 4, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		// Friday (5)
		{Weekday: 5, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 5, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 5, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 5, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 5, StartTime: "16:00", EndTime: "17:00", IsActive: true},
	}

	insertCount := 0
	for _, setting := range settings {
		if err := db.Create(&setting).Error; err != nil {
			log.Printf("插入时段设置失败 (周%d %s): %v", setting.Weekday, setting.StartTime, err)
		} else {
			insertCount++
		}
	}

	fmt.Printf("\n=== 初始化完成 ===")
	fmt.Printf("\n成功插入 %d 条时段设置记录\n", insertCount)
	fmt.Println("\n时段设置已就绪，可以开始使用预约功能！")
}
