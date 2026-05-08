package main

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

func generatePassword(length int) (string, error) {
	if length < 8 {
		length = 12
	}

	password := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[n.Int64()]
	}
	return string(password), nil
}

func hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

func createAdmin(db *gorm.DB, passwordHash string) (*model.Admin, error) {
	var count int64
	if err := db.Model(&model.Admin{}).Count(&count).Error; err != nil {
		return nil, fmt.Errorf("检查管理员数量失败: %w", err)
	}

	if count > 0 {
		return nil, errors.New("管理员已存在")
	}

	admin := &model.Admin{
		PasswordHash: passwordHash,
	}

	if err := db.Create(admin).Error; err != nil {
		return nil, fmt.Errorf("创建管理员失败: %w", err)
	}

	return admin, nil
}

func main() {
	fmt.Println("=== 管理员创建工具 ===")

	cfg := config.Load()

	fmt.Println("正在连接数据库...")
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	fmt.Println("数据库连接成功")

	fmt.Println("\n正在生成随机密码...")
	password, err := generatePassword(12)
	if err != nil {
		log.Fatalf("生成密码失败: %v", err)
	}

	fmt.Println("正在加密密码...")
	passwordHash, err := hashPassword(password)
	if err != nil {
		log.Fatalf("密码加密失败: %v", err)
	}

	fmt.Println("正在创建管理员...")
	admin, err := createAdmin(db, passwordHash)
	if err != nil {
		log.Fatalf("创建管理员失败: %v", err)
	}

	fmt.Println("\n=== 管理员创建成功 ===")
	fmt.Printf("管理员ID: %d\n", admin.ID)
	fmt.Printf("密码: %s\n", password)
	fmt.Println("\n请妥善保管密码，建议登录后修改为更安全的密码")
}
