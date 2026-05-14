package service

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"

	"golang.org/x/image/draw"
)

const (
	maxCoverWidth  = 1920
	maxCoverHeight = 1280
	maxImageWidth  = 1920
	maxImageHeight = 1920
	maxAvatarSize  = 400
	jpegQuality    = 80
)

func processImage(src io.Reader, maxWidth, maxHeight int, keepPNG bool) ([]byte, string, error) {
	img, format, err := image.Decode(src)
	if err != nil {
		return nil, "", fmt.Errorf("decode image: %w", err)
	}

	bounds := img.Bounds()
	w := bounds.Dx()
	h := bounds.Dy()

	if w > maxWidth || h > maxHeight {
		newW, newH := scaleToFit(w, h, maxWidth, maxHeight)
		img = resize(img, newW, newH)
	}

	var buf bytes.Buffer

	if keepPNG && format == "png" {
		if err := png.Encode(&buf, img); err != nil {
			return nil, "", fmt.Errorf("encode png: %w", err)
		}
		return buf.Bytes(), "image/png", nil
	}

	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: jpegQuality}); err != nil {
		return nil, "", fmt.Errorf("encode jpeg: %w", err)
	}
	return buf.Bytes(), "image/jpeg", nil
}

func scaleToFit(w, h, maxW, maxH int) (int, int) {
	if w <= maxW && h <= maxH {
		return w, h
	}
	ratioW := float64(maxW) / float64(w)
	ratioH := float64(maxH) / float64(h)
	ratio := ratioW
	if ratioH < ratioW {
		ratio = ratioH
	}
	return int(float64(w) * ratio), int(float64(h) * ratio)
}

func resize(src image.Image, width, height int) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), draw.Over, nil)
	return dst
}

func processCoverImage(src io.Reader) ([]byte, string, error) {
	return processImage(src, maxCoverWidth, maxCoverHeight, false)
}

func processProjectImage(src io.Reader) ([]byte, string, error) {
	return processImage(src, maxImageWidth, maxImageHeight, false)
}

func processAvatar(src io.Reader) ([]byte, string, error) {
	return processImage(src, maxAvatarSize, maxAvatarSize, true)
}

func init() {
	image.RegisterFormat("jpeg", "jpeg", jpeg.Decode, jpeg.DecodeConfig)
	image.RegisterFormat("png", "png", png.Decode, png.DecodeConfig)
	image.RegisterFormat("gif", "gif", gif.Decode, gif.DecodeConfig)
}
