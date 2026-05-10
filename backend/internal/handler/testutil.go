package handler

import (
	"errors"
	"time"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
)

// MockAuthService is a mock implementation of AuthServiceInterface for testing.
type MockAuthService struct {
	LoginFunc       func(password string) (*service.LoginResult, error)
	GetAdminFunc    func(id uint) (*model.AdminResponse, error)
	ValidateTokenFunc func(tokenString string) (uint, error)
}

func NewMockAuthService() *MockAuthService {
	return &MockAuthService{
		LoginFunc: func(password string) (*service.LoginResult, error) {
			if password == "correct-password" {
				return &service.LoginResult{
					Token:     "test-jwt-token",
					ExpiresAt: time.Now().Add(24 * time.Hour),
				}, nil
			}
			return nil, service.ErrInvalidPassword
		},
		GetAdminFunc: func(id uint) (*model.AdminResponse, error) {
			if id == 1 {
				return &model.AdminResponse{
					ID:                1,
					NotificationEmail: "admin@example.com",
					CreatedAt:         time.Now(),
				}, nil
			}
			return nil, service.ErrAdminNotFound
		},
		ValidateTokenFunc: func(tokenString string) (uint, error) {
			if tokenString == "valid-token" || tokenString == "test-jwt-token" {
				return 1, nil
			}
			return 0, errors.New("token无效或已过期")
		},
	}
}

func (m *MockAuthService) Login(password string) (*service.LoginResult, error) {
	return m.LoginFunc(password)
}

func (m *MockAuthService) GetAdmin(id uint) (*model.AdminResponse, error) {
	return m.GetAdminFunc(id)
}

func (m *MockAuthService) ValidateToken(tokenString string) (uint, error) {
	return m.ValidateTokenFunc(tokenString)
}

// SetupTestGin creates a Gin engine in test mode.
func SetupTestGin() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}
