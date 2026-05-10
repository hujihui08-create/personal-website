package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"portfolio-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// TestAuthHandler_Login_ValidCredentials tests that POST /api/auth/login
// with a correct password returns 200 and a token.
func TestAuthHandler_Login_ValidCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.POST("/api/auth/login", authHandler.Login)

	body := `{"password":"correct-password"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	// The auth handler's Login method returns LoginResponse directly (not wrapped in ApiResponse)
	if token, ok := resp["token"]; !ok || token == "" {
		t.Errorf("expected token in response, got %v", resp)
	}
	if expiresAt, ok := resp["expires_at"]; !ok || expiresAt == "" {
		t.Errorf("expected expires_at in response, got %v", resp)
	}
}

// TestAuthHandler_Login_InvalidCredentials tests that POST /api/auth/login
// with a wrong password returns 401.
func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.POST("/api/auth/login", authHandler.Login)

	body := `{"password":"wrong-password"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	// Auth handler returns {"error": {"code": "UNAUTHORIZED", "message": "密码错误"}}
	errObj, ok := resp["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'error' object in response, got %v", resp)
	}
	if code, _ := errObj["code"].(string); code != "UNAUTHORIZED" {
		t.Errorf("expected error code 'UNAUTHORIZED', got '%s'", code)
	}
	if msg, _ := errObj["message"].(string); msg != "密码错误" {
		t.Errorf("expected message '密码错误', got '%s'", msg)
	}
}

// TestAuthHandler_Login_EmptyPassword tests that POST /api/auth/login
// with an empty password returns 400.
func TestAuthHandler_Login_EmptyPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.POST("/api/auth/login", authHandler.Login)

	body := `{"password":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	errObj, ok := resp["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'error' object in response, got %v", resp)
	}
	if code, _ := errObj["code"].(string); code != "INVALID_REQUEST" {
		t.Errorf("expected error code 'INVALID_REQUEST', got '%s'", code)
	}
}

// TestAuthHandler_Me_WithoutToken tests that GET /api/auth/me
// without an Authorization header returns 401.
func TestAuthHandler_Me_WithoutToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.GET("/api/auth/me", middleware.AuthMiddleware(mockAuth), authHandler.Me)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	// Middleware returns {"error": {"code": "UNAUTHORIZED", "message": "缺少认证Token"}}
	errObj, ok := resp["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'error' object in response, got %v", resp)
	}
	if code, _ := errObj["code"].(string); code != "UNAUTHORIZED" {
		t.Errorf("expected error code 'UNAUTHORIZED', got '%s'", code)
	}
	if msg, _ := errObj["message"].(string); msg != "缺少认证Token" {
		t.Errorf("expected message '缺少认证Token', got '%s'", msg)
	}
}

// TestAuthHandler_Me_WithValidToken tests that GET /api/auth/me
// with a valid Authorization header returns 200 and admin info.
func TestAuthHandler_Me_WithValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.GET("/api/auth/me", middleware.AuthMiddleware(mockAuth), authHandler.Me)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	// AdminResponse should be returned directly
	if id, ok := resp["id"]; !ok || id != float64(1) {
		t.Errorf("expected id=1 in response, got %v", resp)
	}
	if email, ok := resp["notification_email"]; !ok || email != "admin@example.com" {
		t.Errorf("expected notification_email in response, got %v", resp)
	}
}

// TestAuthHandler_Me_WithInvalidToken tests that GET /api/auth/me
// with an invalid Authorization header returns 401.
func TestAuthHandler_Me_WithInvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockAuth := NewMockAuthService()
	authHandler := NewAuthHandler(mockAuth)

	r := gin.New()
	r.GET("/api/auth/me", middleware.AuthMiddleware(mockAuth), authHandler.Me)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	errObj, ok := resp["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'error' object in response, got %v", resp)
	}
	if code, _ := errObj["code"].(string); code != "UNAUTHORIZED" {
		t.Errorf("expected error code 'UNAUTHORIZED', got '%s'", code)
	}
}
