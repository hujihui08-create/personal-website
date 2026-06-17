package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"portfolio-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// routeTest describes a route to test.
type routeTest struct {
	method   string
	path     string
	body     string // request body (empty string for GET/DELETE)
	protected bool  // whether the route requires auth
}

// standardRoutes defines all routes matching the real router.go setup.
// Routes with path parameters use placeholder values (e.g., "1" for ":id").
var standardRoutes = []routeTest{
	// Public routes
	{method: "GET", path: "/api/health", protected: false},
	{method: "GET", path: "/api/files/test.txt", protected: false},
	{method: "POST", path: "/api/auth/login", body: `{"password":"test"}`, protected: false},
	{method: "GET", path: "/api/profile", protected: false},
	{method: "GET", path: "/api/experiences", protected: false},
	{method: "GET", path: "/api/resume", protected: false},
	{method: "GET", path: "/api/projects", protected: false},
	{method: "GET", path: "/api/projects/featured", protected: false},
	{method: "GET", path: "/api/projects/1", protected: false},
	{method: "GET", path: "/api/bookings/slots?date=2026-01-01", protected: false},
	{method: "POST", path: "/api/bookings", body: `{"company_name":"Test","company_location":"TestCity","booking_date":"2026-01-01","booking_time":"10:00","contact_name":"Test","contact_email":"test@example.com","contact_phone":"1234567890"}`, protected: false},
	{method: "GET", path: "/api/bookings/lookup?id=1&phone=13800138000", protected: false},
	{method: "PUT", path: "/api/bookings/1/cancel?phone=13800138000", protected: false},
	{method: "PUT", path: "/api/bookings/1?phone=13800138000", body: `{"company_name":"Updated"}`, protected: false},
	{method: "POST", path: "/api/agent/chat", body: `{"message":"hello"}`, protected: false},
	{method: "GET", path: "/api/agent/history?session_id=test", protected: false},
	{method: "POST", path: "/api/agent/clear", body: `{"session_id":"test"}`, protected: false},
	{method: "GET", path: "/api/agent/sessions?visitor_id=test-visitor", protected: false},

	// Agent debug routes (protected)
	{method: "POST", path: "/api/agent/debug", body: `{"message":"test"}`, protected: true},
	{method: "GET", path: "/api/agent/debug/history?page=1&page_size=20", protected: true},
	{method: "DELETE", path: "/api/agent/debug/history", protected: true},
	{method: "DELETE", path: "/api/agent/debug/history?id=1", protected: true},
	{method: "GET", path: "/api/agent/debug/retrieval?query=test&top_k=3", protected: true},

	// Agent prompt routes (protected)
	{method: "GET", path: "/api/agent/prompts?page=1&page_size=20", protected: true},
	{method: "POST", path: "/api/agent/prompts", body: `{"agent_type":"profile","name":"Test","system_prompt":"Test"}`, protected: true},
	{method: "GET", path: "/api/agent/prompts/1", protected: true},
	{method: "PUT", path: "/api/agent/prompts/1", body: `{"name":"Updated"}`, protected: true},
	{method: "DELETE", path: "/api/agent/prompts/1", protected: true},
	{method: "PUT", path: "/api/agent/prompts/1/default", protected: true},
	{method: "POST", path: "/api/agent/prompts/1/test", body: `{"message":"test"}`, protected: true},

	// Protected routes
	{method: "POST", path: "/api/auth/logout", body: `{}`, protected: true},
	{method: "GET", path: "/api/auth/me", protected: true},
	{method: "PUT", path: "/api/profile", body: `{"name":"test"}`, protected: true},
	{method: "POST", path: "/api/profile/avatar", protected: true},
	{method: "POST", path: "/api/experiences", body: `{"company":"Test"}`, protected: true},
	{method: "PUT", path: "/api/experiences/reorder", body: `{"ids":[1,2]}`, protected: true},
	{method: "PUT", path: "/api/experiences/1", body: `{"company":"Test"}`, protected: true},
	{method: "DELETE", path: "/api/experiences/1", protected: true},
	{method: "POST", path: "/api/resume", protected: true},
	{method: "POST", path: "/api/projects", body: `{"title":"Test"}`, protected: true},
	{method: "PUT", path: "/api/projects/1", body: `{"title":"Test"}`, protected: true},
	{method: "DELETE", path: "/api/projects/1", protected: true},
	{method: "PUT", path: "/api/projects/reorder", body: `{"ids":[1,2]}`, protected: true},
	{method: "PUT", path: "/api/projects/1/featured", protected: true},
	{method: "POST", path: "/api/projects/upload-cover", protected: true},
	{method: "POST", path: "/api/projects/upload-image", protected: true},
	{method: "GET", path: "/api/bookings", protected: true},
	{method: "GET", path: "/api/bookings/1", protected: true},
	{method: "PUT", path: "/api/bookings/1/status", body: `{"status":"confirmed"}`, protected: true},
	{method: "GET", path: "/api/schedule", protected: true},
	{method: "PUT", path: "/api/schedule", body: `{"slots":[]}`, protected: true},
	{method: "GET", path: "/api/notifications", protected: true},
	{method: "PUT", path: "/api/notifications/1/read", protected: true},
	{method: "PUT", path: "/api/notifications/read-all", protected: true},
	{method: "GET", path: "/api/notifications/unread", protected: true},
	{method: "GET", path: "/api/knowledge", protected: true},
	{method: "POST", path: "/api/knowledge", protected: true},
	{method: "DELETE", path: "/api/knowledge/1", protected: true},
	{method: "POST", path: "/api/knowledge/reindex", protected: true},
	{method: "GET", path: "/api/config", protected: true},
	{method: "GET", path: "/api/config/llm", protected: true},
	{method: "PUT", path: "/api/config/llm", body: `{"provider":"openai"}`, protected: true},
	{method: "GET", path: "/api/config/embedding", protected: true},
	{method: "PUT", path: "/api/config/embedding", body: `{"provider":"openai"}`, protected: true},
}

// standardHandler returns a Gin handler function that responds with the standard
// {"code": 200, "message": "success", "data": null} format.
func standardHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    nil,
	})
}

// setupTestRouter creates a Gin engine with all routes registered using mock handlers.
// This mimics the real router.go but without any external dependencies.
func setupTestRouter() *gin.Engine {
	r := gin.New()
	mockAuth := NewMockAuthService()

	api := r.Group("/api")
	{
		api.GET("/health", standardHandler)

		api.GET("/files/*filepath", standardHandler)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", standardHandler)
			auth.POST("/logout", middleware.AuthMiddleware(mockAuth), standardHandler)
			auth.GET("/me", middleware.AuthMiddleware(mockAuth), standardHandler)
		}

		// Profile routes
		profile := api.Group("/profile")
		{
			profile.GET("", standardHandler)
			profile.PUT("", middleware.AuthMiddleware(mockAuth), standardHandler)
			profile.POST("/avatar", middleware.AuthMiddleware(mockAuth), standardHandler)
		}

		// Work experience routes
		experiences := api.Group("/experiences")
		{
			experiences.GET("", standardHandler)
			experiences.POST("", middleware.AuthMiddleware(mockAuth), standardHandler)
			experiences.PUT("/reorder", middleware.AuthMiddleware(mockAuth), standardHandler)
			experiences.PUT("/:id", middleware.AuthMiddleware(mockAuth), standardHandler)
			experiences.DELETE("/:id", middleware.AuthMiddleware(mockAuth), standardHandler)
		}

		// Resume routes
		resume := api.Group("/resume")
		{
			resume.GET("", standardHandler)
			resume.POST("", middleware.AuthMiddleware(mockAuth), standardHandler)
		}

		// Project routes (public)
		projects := api.Group("/projects")
		{
			projects.GET("", standardHandler)
			projects.GET("/featured", standardHandler)
			projects.GET("/:id", standardHandler)
		}

		// Project routes (protected)
		projectsProtected := api.Group("/projects")
		projectsProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			projectsProtected.POST("", standardHandler)
			projectsProtected.PUT("/:id", standardHandler)
			projectsProtected.DELETE("/:id", standardHandler)
			projectsProtected.PUT("/reorder", standardHandler)
			projectsProtected.PUT("/:id/featured", standardHandler)
			projectsProtected.POST("/upload-cover", standardHandler)
			projectsProtected.POST("/upload-image", standardHandler)
		}

		// Booking routes (public)
		bookings := api.Group("/bookings")
		{
			bookings.GET("/slots", standardHandler)
			bookings.POST("", standardHandler)
			bookings.GET("/lookup", standardHandler)
			bookings.PUT("/:id/cancel", standardHandler)
			bookings.PUT("/:id", standardHandler)
		}

		// Booking management (protected)
		bookingsProtected := api.Group("/bookings")
		bookingsProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			bookingsProtected.GET("", standardHandler)
			bookingsProtected.GET("/:id", standardHandler)
			bookingsProtected.PUT("/:id/status", standardHandler)
		}

		// Schedule settings (protected)
		scheduleProtected := api.Group("/schedule")
		scheduleProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			scheduleProtected.GET("", standardHandler)
			scheduleProtected.PUT("", standardHandler)
		}

		// Notifications (protected)
		notificationsProtected := api.Group("/notifications")
		notificationsProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			notificationsProtected.GET("", standardHandler)
			notificationsProtected.PUT("/:id/read", standardHandler)
			notificationsProtected.PUT("/read-all", standardHandler)
			notificationsProtected.GET("/unread", standardHandler)
		}

		// Agent (public)
		api.POST("/agent/chat", standardHandler)
		api.GET("/agent/history", standardHandler)
		api.POST("/agent/clear", standardHandler)
		api.GET("/agent/sessions", standardHandler)

		// Agent debug (protected)
		agentDebugProtected := api.Group("/agent/debug")
		agentDebugProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			agentDebugProtected.POST("", standardHandler)
			agentDebugProtected.GET("/history", standardHandler)
			agentDebugProtected.DELETE("/history", standardHandler)
			agentDebugProtected.GET("/retrieval", standardHandler)
		}

		// Agent prompt management (protected)
		agentPromptsProtected := api.Group("/agent/prompts")
		agentPromptsProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			agentPromptsProtected.GET("", standardHandler)
			agentPromptsProtected.POST("", standardHandler)
			agentPromptsProtected.GET("/:id", standardHandler)
			agentPromptsProtected.PUT("/:id", standardHandler)
			agentPromptsProtected.DELETE("/:id", standardHandler)
			agentPromptsProtected.PUT("/:id/default", standardHandler)
			agentPromptsProtected.POST("/:id/test", standardHandler)
		}

		// Knowledge (protected)
		knowledgeProtected := api.Group("/knowledge")
		knowledgeProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			knowledgeProtected.GET("", standardHandler)
			knowledgeProtected.POST("", standardHandler)
			knowledgeProtected.DELETE("/:id", standardHandler)
			knowledgeProtected.POST("/reindex", standardHandler)
		}

		// Config (protected)
		configProtected := api.Group("/config")
		configProtected.Use(middleware.AuthMiddleware(mockAuth))
		{
			configProtected.GET("", standardHandler)
			configProtected.GET("/llm", standardHandler)
			configProtected.PUT("/llm", standardHandler)
			configProtected.GET("/embedding", standardHandler)
			configProtected.PUT("/embedding", standardHandler)
		}
	}

	return r
}

// TestRouter_PublicRoutes_ReturnSuccess tests that all public routes respond
// with a valid JSON response containing code and message fields.
func TestRouter_PublicRoutes_ReturnSuccess(t *testing.T) {
	r := setupTestRouter()

	for _, rt := range standardRoutes {
		if rt.protected {
			continue
		}

		t.Run(rt.method+" "+rt.path, func(t *testing.T) {
			var bodyReader io.Reader
			if rt.body != "" {
				bodyReader = strings.NewReader(rt.body)
			}

			req := httptest.NewRequest(rt.method, rt.path, bodyReader)
			if rt.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Public routes should return either 200 (success) or occasionally
			// 400 (if the mock handler rejects bad input). We check that the
			// response is valid JSON with standard fields.
			if w.Code != http.StatusOK && w.Code != http.StatusBadRequest {
				t.Errorf("expected 200 or 400, got %d for %s %s", w.Code, rt.method, rt.path)
			}

			var resp map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("response is not valid JSON for %s %s: %v\nBody: %s", rt.method, rt.path, err, w.Body.String())
			}

			// Verify the standard response format fields are present
			if _, ok := resp["code"]; !ok {
				t.Errorf("response missing 'code' field for %s %s: %v", rt.method, rt.path, resp)
			}
			if _, ok := resp["message"]; !ok {
				t.Errorf("response missing 'message' field for %s %s: %v", rt.method, rt.path, resp)
			}
		})
	}
}

// TestRouter_ProtectedRoutes_Return401WithoutAuth tests that all protected
// routes return 401 when accessed without an Authorization header.
func TestRouter_ProtectedRoutes_Return401WithoutAuth(t *testing.T) {
	r := setupTestRouter()

	for _, rt := range standardRoutes {
		if !rt.protected {
			continue
		}

		t.Run(rt.method+" "+rt.path, func(t *testing.T) {
			var bodyReader io.Reader
			if rt.body != "" {
				bodyReader = strings.NewReader(rt.body)
			}

			req := httptest.NewRequest(rt.method, rt.path, bodyReader)
			if rt.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			// No Authorization header

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected 401, got %d for %s %s\nBody: %s", w.Code, rt.method, rt.path, w.Body.String())
			}

			// Verify JSON response with error information
			var resp map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("response is not valid JSON for %s %s: %v\nBody: %s", rt.method, rt.path, err, w.Body.String())
			}

			// Middleware returns {"error": {"code": "UNAUTHORIZED", "message": "缺少认证Token"}}
			errObj, ok := resp["error"].(map[string]any)
			if !ok {
				t.Errorf("expected 'error' object in response for %s %s, got %v", rt.method, rt.path, resp)
			} else {
				if code, _ := errObj["code"].(string); code != "UNAUTHORIZED" {
					t.Errorf("expected error code 'UNAUTHORIZED', got '%s' for %s %s", code, rt.method, rt.path)
				}
				if msg, _ := errObj["message"].(string); msg == "" {
					t.Errorf("expected non-empty error message for %s %s", rt.method, rt.path)
				}
			}
		})
	}
}

// TestRouter_ProtectedRoutes_ReturnSuccessWithAuth tests that all protected
// routes return 200 when accessed with a valid Authorization header.
func TestRouter_ProtectedRoutes_ReturnSuccessWithAuth(t *testing.T) {
	r := setupTestRouter()

	for _, rt := range standardRoutes {
		if !rt.protected {
			continue
		}

		t.Run(rt.method+" "+rt.path, func(t *testing.T) {
			var bodyReader io.Reader
			if rt.body != "" {
				bodyReader = strings.NewReader(rt.body)
			}

			req := httptest.NewRequest(rt.method, rt.path, bodyReader)
			if rt.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			req.Header.Set("Authorization", "Bearer valid-token")

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("expected 200, got %d for %s %s\nBody: %s", w.Code, rt.method, rt.path, w.Body.String())
			}

			var resp map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("response is not valid JSON for %s %s: %v\nBody: %s", rt.method, rt.path, err, w.Body.String())
			}

			// Verify the standard response format
			code, ok := resp["code"].(float64)
			if !ok {
				t.Errorf("response missing 'code' field for %s %s: %v", rt.method, rt.path, resp)
			} else if code != 200 {
				t.Errorf("expected code=200, got code=%.0f for %s %s", code, rt.method, rt.path)
			}
			if _, ok := resp["message"]; !ok {
				t.Errorf("response missing 'message' field for %s %s: %v", rt.method, rt.path, resp)
			}
		})
	}
}

// TestRouter_AllRoutes_AreRegistered tests that every route defined in
// standardRoutes is actually reachable and does not return 404.
func TestRouter_AllRoutes_AreRegistered(t *testing.T) {
	r := setupTestRouter()

	for _, rt := range standardRoutes {
		t.Run(rt.method+" "+rt.path, func(t *testing.T) {
			var bodyReader io.Reader
			if rt.body != "" {
				bodyReader = strings.NewReader(rt.body)
			}

			req := httptest.NewRequest(rt.method, rt.path, bodyReader)
			if rt.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}

			// For protected routes, include auth to reach the handler
			if rt.protected {
				req.Header.Set("Authorization", "Bearer valid-token")
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Routes should NOT return 404
			if w.Code == http.StatusNotFound {
				t.Errorf("route %s %s returned 404 (not registered)", rt.method, rt.path)
			}
		})
	}
}
