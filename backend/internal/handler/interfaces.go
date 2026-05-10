package handler

import (
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/service"
)

// AuthServiceInterface defines the methods needed from the auth service.
// This interface allows mocking in tests without requiring a real database.
type AuthServiceInterface interface {
	Login(password string) (*service.LoginResult, error)
	GetAdmin(id uint) (*model.AdminResponse, error)
	ValidateToken(tokenString string) (uint, error)
}
