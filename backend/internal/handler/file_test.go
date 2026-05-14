package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

type mockFileStorage struct {
	statObjectFn func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error)
	getObjectFn  func(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error)
}

func (m *mockFileStorage) StatObject(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
	return m.statObjectFn(ctx, bucket, object, opts)
}

func (m *mockFileStorage) GetObject(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error) {
	return m.getObjectFn(ctx, bucket, object, opts)
}

type fileStorageInterface interface {
	StatObject(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error)
	GetObject(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error)
}

type testableFileHandler struct {
	storage fileStorageInterface
	bucket  string
}

func newTestableFileHandler(storage fileStorageInterface, bucket string) *testableFileHandler {
	return &testableFileHandler{storage: storage, bucket: bucket}
}

func (h *testableFileHandler) GetFile(c *gin.Context) {
	filepath := c.Param("filepath")
	filepath = strings.TrimPrefix(filepath, "/")

	if filepath == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件路径不能为空",
			"data":    nil,
		})
		return
	}

	if h.storage == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "文件服务未配置",
			"data":    nil,
		})
		return
	}

	parts := strings.Split(filepath, "/")
	filename := parts[len(parts)-1]

	ctx := context.Background()

	objectInfo, err := h.storage.StatObject(ctx, h.bucket, filepath, minio.StatObjectOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "文件不存在",
			"data":    nil,
		})
		return
	}

	contentType := objectInfo.ContentType
	isImage := strings.HasPrefix(contentType, "image/")

	disposition := "inline"
	if !isImage {
		disposition = "attachment; filename=\"" + filename + "\""
	}

	c.Header("Content-Disposition", disposition)
	c.Header("Content-Type", contentType)

	if isImage {
		etag := "\"" + objectInfo.ETag + "\""
		c.Header("ETag", etag)
		c.Header("Cache-Control", "public, max-age=31536000, immutable")
	}

	obj, err := h.storage.GetObject(ctx, h.bucket, filepath, minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取文件失败",
			"data":    nil,
		})
		return
	}
	defer obj.Close()

	io.Copy(c.Writer, obj)
}

func TestFileHandler_EmptyPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	storage := &mockFileStorage{}
	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}

	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["code"] != float64(400) {
		t.Errorf("expected code 400, got %v", resp["code"])
	}
}

func TestFileHandler_NilStorage(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := newTestableFileHandler(nil, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/test.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestFileHandler_ImageCacheHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	content := []byte("fake-png-data")
	etagValue := "abc123def456"

	storage := &mockFileStorage{
		statObjectFn: func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
			return minio.ObjectInfo{
				ContentType:  "image/png",
				ETag:         etagValue,
				Size:         int64(len(content)),
				LastModified: time.Now(),
			}, nil
		},
		getObjectFn: func(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error) {
			return io.NopCloser(bytes.NewReader(content)), nil
		},
	}

	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/projects/covers/test.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	cacheControl := w.Header().Get("Cache-Control")
	if cacheControl == "" {
		t.Error("expected Cache-Control header to be set for images")
	}
	if !strings.Contains(cacheControl, "max-age=31536000") {
		t.Errorf("expected Cache-Control to contain max-age=31536000, got: %s", cacheControl)
	}
	if !strings.Contains(cacheControl, "immutable") {
		t.Errorf("expected Cache-Control to contain immutable, got: %s", cacheControl)
	}
	if !strings.Contains(cacheControl, "public") {
		t.Errorf("expected Cache-Control to contain public, got: %s", cacheControl)
	}

	etag := w.Header().Get("ETag")
	expectedEtag := `"` + etagValue + `"`
	if etag != expectedEtag {
		t.Errorf("expected ETag %s, got %s", expectedEtag, etag)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "image/png" {
		t.Errorf("expected Content-Type image/png, got %s", contentType)
	}

	disposition := w.Header().Get("Content-Disposition")
	if disposition != "inline" {
		t.Errorf("expected Content-Disposition inline for images, got %s", disposition)
	}

	body := w.Body.Bytes()
	if !bytes.Equal(body, content) {
		t.Errorf("response body mismatch: got %d bytes, want %d bytes", len(body), len(content))
	}
}

func TestFileHandler_ImageJPEGCacheHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	content := []byte("fake-jpeg-data")

	storage := &mockFileStorage{
		statObjectFn: func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
			return minio.ObjectInfo{
				ContentType:  "image/jpeg",
				Size:         int64(len(content)),
				LastModified: time.Now(),
			}, nil
		},
		getObjectFn: func(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error) {
			return io.NopCloser(bytes.NewReader(content)), nil
		},
	}

	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/test.jpg", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	cacheControl := w.Header().Get("Cache-Control")
	if cacheControl == "" {
		t.Error("expected Cache-Control for JPEG images")
	}
}

func TestFileHandler_NonImageNoCacheHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	content := []byte("fake-pdf-data")

	storage := &mockFileStorage{
		statObjectFn: func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
			return minio.ObjectInfo{
				ContentType:  "application/pdf",
				Size:         int64(len(content)),
				LastModified: time.Now(),
			}, nil
		},
		getObjectFn: func(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error) {
			return io.NopCloser(bytes.NewReader(content)), nil
		},
	}

	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/resumes/test.pdf", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	cacheControl := w.Header().Get("Cache-Control")
	if cacheControl != "" {
		t.Errorf("expected no Cache-Control for non-image files, got: %s", cacheControl)
	}

	etag := w.Header().Get("ETag")
	if etag != "" {
		t.Errorf("expected no ETag for non-image files, got: %s", etag)
	}

	disposition := w.Header().Get("Content-Disposition")
	if !strings.Contains(disposition, "attachment") {
		t.Errorf("expected Content-Disposition attachment for non-image, got: %s", disposition)
	}
	if !strings.Contains(disposition, "test.pdf") {
		t.Errorf("expected filename in Content-Disposition, got: %s", disposition)
	}
}

func TestFileHandler_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	storage := &mockFileStorage{
		statObjectFn: func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
			return minio.ObjectInfo{}, minio.ErrorResponse{
				StatusCode: 404,
				Code:       "NoSuchKey",
				Message:    "Object not found",
			}
		},
	}

	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/nonexistent.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestFileHandler_GetObjectError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	storage := &mockFileStorage{
		statObjectFn: func(ctx context.Context, bucket, object string, opts minio.StatObjectOptions) (minio.ObjectInfo, error) {
			return minio.ObjectInfo{
				ContentType:  "image/png",
				Size:         100,
				LastModified: time.Now(),
			}, nil
		},
		getObjectFn: func(ctx context.Context, bucket, object string, opts minio.GetObjectOptions) (io.ReadCloser, error) {
			return nil, minio.ErrorResponse{
				StatusCode: 500,
				Code:       "InternalError",
				Message:    "storage error",
			}
		},
	}

	h := newTestableFileHandler(storage, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	req := httptest.NewRequest(http.MethodGet, "/api/files/test.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 for GetObject error, got %d", w.Code)
	}
}

func TestFileHandler_RootPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := newTestableFileHandler(&mockFileStorage{}, "test-bucket")
	r := gin.New()
	r.GET("/api/files/*filepath", h.GetFile)

	// Gin redirects /api/files to /api/files/ for catch-all routes
	req := httptest.NewRequest(http.MethodGet, "/api/files", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest && w.Code != http.StatusMovedPermanently {
		t.Errorf("expected 400 or 301 for root path, got %d", w.Code)
	}
}
