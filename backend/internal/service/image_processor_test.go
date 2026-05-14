package service

import (
	"bytes"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"strings"
	"testing"
)

func createTestPNG(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	var buf bytes.Buffer
	png.Encode(&buf, img)
	return buf.Bytes()
}

func createTestJPEG(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	var buf bytes.Buffer
	jpeg.Encode(&buf, img, &jpeg.Options{Quality: 100})
	return buf.Bytes()
}

func mustDecodeConfig(data []byte) (int, int) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		panic(err)
	}
	return cfg.Width, cfg.Height
}

func TestScaleToFit(t *testing.T) {
	tests := []struct {
		name       string
		w, h       int
		maxW, maxH int
		expW, expH int
	}{
		{"smaller than max, no resize", 100, 100, 200, 200, 100, 100},
		{"equal to max, no resize", 200, 200, 200, 200, 200, 200},
		{"wider than max", 300, 100, 200, 200, 200, 66},
		{"taller than max", 100, 300, 200, 200, 66, 200},
		{"both exceed max", 400, 300, 200, 200, 200, 150},
		{"both exceed max, different ratio", 300, 400, 200, 200, 150, 200},
		{"zero dimensions", 0, 0, 200, 200, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotW, gotH := scaleToFit(tt.w, tt.h, tt.maxW, tt.maxH)
			if gotW != tt.expW || gotH != tt.expH {
				t.Errorf("scaleToFit(%d, %d, %d, %d) = (%d, %d), want (%d, %d)",
					tt.w, tt.h, tt.maxW, tt.maxH, gotW, gotH, tt.expW, tt.expH)
			}
		})
	}
}

func TestResize(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 200, 100))
	dst := resize(src, 100, 50)

	bounds := dst.Bounds()
	if bounds.Dx() != 100 || bounds.Dy() != 50 {
		t.Errorf("resize: got %dx%d, want 100x50", bounds.Dx(), bounds.Dy())
	}
}

func TestProcessImage_JPEGWithinMax(t *testing.T) {
	data := createTestJPEG(100, 100)
	processed, contentType, err := processImage(bytes.NewReader(data), 200, 200, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w != 100 || h != 100 {
		t.Errorf("expected 100x100, got %dx%d", w, h)
	}
	if len(processed) >= len(data) {
		t.Logf("warning: compressed size (%d) not smaller than original (%d) for small image", len(processed), len(data))
	}
}

func TestProcessImage_JPEGExceedsMax(t *testing.T) {
	data := createTestJPEG(800, 600)
	processed, contentType, err := processImage(bytes.NewReader(data), 400, 300, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > 400 || h > 300 {
		t.Errorf("expected <=400x300, got %dx%d", w, h)
	}
	if len(processed) >= len(data) {
		t.Errorf("expected compressed size to be smaller than original: %d >= %d", len(processed), len(data))
	}
}

func TestProcessImage_PNGWithinMaxKeepPNG(t *testing.T) {
	data := createTestPNG(100, 100)
	processed, contentType, err := processImage(bytes.NewReader(data), 200, 200, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/png" {
		t.Errorf("expected image/png, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w != 100 || h != 100 {
		t.Errorf("expected 100x100, got %dx%d", w, h)
	}
}

func TestProcessImage_PNGConvertToJPEG(t *testing.T) {
	data := createTestPNG(500, 500)
	processed, contentType, err := processImage(bytes.NewReader(data), 200, 200, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg after conversion, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > 200 || h > 200 {
		t.Errorf("expected <=200x200, got %dx%d", w, h)
	}
	if len(processed) >= len(data) {
		t.Errorf("expected compressed JPEG to be smaller than original PNG: %d >= %d", len(processed), len(data))
	}
}

func TestProcessImage_InvalidData(t *testing.T) {
	invalidData := []byte("this is not an image")
	_, _, err := processImage(bytes.NewReader(invalidData), 200, 200, false)
	if err == nil {
		t.Error("expected error for invalid image data")
	}
	if !strings.Contains(err.Error(), "decode") {
		t.Errorf("expected decode error, got: %v", err)
	}
}

func TestProcessCoverImage(t *testing.T) {
	data := createTestJPEG(3000, 2000)
	processed, contentType, err := processCoverImage(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > maxCoverWidth || h > maxCoverHeight {
		t.Errorf("expected <=1920x1280, got %dx%d", w, h)
	}
	if len(processed) >= len(data) {
		t.Errorf("expected compressed size to be smaller: %d >= %d", len(processed), len(data))
	}
}

func TestProcessProjectImage(t *testing.T) {
	data := createTestJPEG(2560, 2560)
	processed, contentType, err := processProjectImage(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > maxImageWidth || h > maxImageHeight {
		t.Errorf("expected <=1920x1920, got %dx%d", w, h)
	}
	if len(processed) >= len(data) {
		t.Errorf("expected compressed size to be smaller: %d >= %d", len(processed), len(data))
	}
}

func TestProcessAvatar_PNG(t *testing.T) {
	data := createTestPNG(800, 800)
	processed, contentType, err := processAvatar(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/png" {
		t.Errorf("expected image/png for avatar, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > maxAvatarSize || h > maxAvatarSize {
		t.Errorf("expected <=400x400, got %dx%d", w, h)
	}
}

func TestProcessAvatar_JPEG(t *testing.T) {
	data := createTestJPEG(800, 800)
	processed, contentType, err := processAvatar(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if contentType != "image/jpeg" {
		t.Errorf("expected image/jpeg for JPEG avatar, got %s", contentType)
	}
	w, h := mustDecodeConfig(processed)
	if w > maxAvatarSize || h > maxAvatarSize {
		t.Errorf("expected <=400x400, got %dx%d", w, h)
	}
}

func TestProcessAvatar_NoResizeWhenSmall(t *testing.T) {
	data := createTestPNG(100, 100)
	processed, _, err := processAvatar(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	w, h := mustDecodeConfig(processed)
	if w != 100 || h != 100 {
		t.Errorf("small image should not be resized, got %dx%d", w, h)
	}
}

func TestJPEGQualityReduction(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 1000, 800))
	var highQ, lowQ bytes.Buffer
	jpeg.Encode(&highQ, img, &jpeg.Options{Quality: 100})
	jpeg.Encode(&lowQ, img, &jpeg.Options{Quality: jpegQuality})
	if lowQ.Len() >= highQ.Len() {
		t.Errorf("quality %d should produce smaller output than quality 100: %d >= %d", jpegQuality, lowQ.Len(), highQ.Len())
	}
}

func TestProcessImage_EmptyReader(t *testing.T) {
	_, _, err := processImage(strings.NewReader(""), 200, 200, false)
	if err == nil {
		t.Error("expected error for empty reader")
	}
}

func TestProcessImage_IOReader(t *testing.T) {
	data := createTestJPEG(100, 100)
	var r io.Reader = bytes.NewReader(data)
	processed, _, err := processImage(r, 200, 200, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(processed) == 0 {
		t.Error("expected non-empty output")
	}
}
