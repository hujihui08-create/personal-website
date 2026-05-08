package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidPassword = errors.New("密码错误")
	ErrRateLimited     = errors.New("登录失败次数过多，请15分钟后再试")
	ErrAdminNotFound   = errors.New("管理员不存在")
)

type AuthService struct {
	adminRepo *repository.AdminRepository
	jwtConfig config.JWTConfig
}

func NewAuthService(adminRepo *repository.AdminRepository, jwtConfig config.JWTConfig) *AuthService {
	return &AuthService{
		adminRepo: adminRepo,
		jwtConfig: jwtConfig,
	}
}

type LoginResult struct {
	Token     string
	ExpiresAt time.Time
}

func (s *AuthService) Login(password string) (*LoginResult, error) {
	ctx := context.Background()
	ip := "default"

	rateLimitKey := fmt.Sprintf("login:fail:%s", ip)
	count, _ := database.RedisClient.Get(ctx, rateLimitKey).Int()
	if count >= 5 {
		return nil, ErrRateLimited
	}

	admin, err := s.adminRepo.FindFirst()
	if err != nil {
		return nil, ErrAdminNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		database.RedisClient.Incr(ctx, rateLimitKey)
		database.RedisClient.Expire(ctx, rateLimitKey, 15*time.Minute)
		return nil, ErrInvalidPassword
	}

	database.RedisClient.Del(ctx, rateLimitKey)

	expiresAt := time.Now().Add(s.jwtConfig.Expiration)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": admin.ID,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.jwtConfig.Secret))
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		Token:     tokenString,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtConfig.Secret), nil
	})

	if err != nil || !token.Valid {
		return 0, errors.New("token无效或已过期")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("token解析失败")
	}

	adminID, ok := claims["admin_id"].(float64)
	if !ok {
		return 0, errors.New("token缺少admin_id")
	}

	return uint(adminID), nil
}

func (s *AuthService) GetAdmin(id uint) (*model.AdminResponse, error) {
	admin, err := s.adminRepo.FindFirst()
	if err != nil {
		return nil, ErrAdminNotFound
	}

	return &model.AdminResponse{
		ID:                admin.ID,
		NotificationEmail: admin.NotificationEmail,
		CreatedAt:         admin.CreatedAt,
	}, nil
}
