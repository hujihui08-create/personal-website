package service

import (
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/minio/minio-go/v7"
)

type ResumeService struct {
	resumeRepo  *repository.ResumeRepository
	minioClient *minio.Client
	cfg         *config.Config
}

func NewResumeService(resumeRepo *repository.ResumeRepository, minioClient *minio.Client, cfg *config.Config) *ResumeService {
	return &ResumeService{
		resumeRepo:  resumeRepo,
		minioClient: minioClient,
		cfg:         cfg,
	}
}

type ResumeResponse struct {
	ID        uint   `json:"id"`
	FileURL   string `json:"file_url"`
	FileName  string `json:"file_name"`
	UpdatedAt string `json:"updated_at"`
}

func (s *ResumeService) GetResume() (*ResumeResponse, error) {
	resume, err := s.resumeRepo.GetLatest()
	if err != nil {
		return nil, err
	}

	return &ResumeResponse{
		ID:        resume.ID,
		FileURL:   resume.FileURL,
		FileName:  resume.FileName,
		UpdatedAt: resume.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *ResumeService) UploadResume(file multipart.File, header *multipart.FileHeader) (*ResumeResponse, error) {
	if s.minioClient == nil {
		return nil, fmt.Errorf("MinIO client not initialized")
	}

	objectName := fmt.Sprintf("resumes/%s", header.Filename)

	ctx := context.Background()
	contentType := header.Header.Get("Content-Type")

	_, err := s.minioClient.PutObject(ctx, s.cfg.MinIO.Bucket, objectName, file, header.Size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload resume to MinIO: %w", err)
	}

	fileURL := fmt.Sprintf("/api/files/%s", objectName)

	resume := &model.Resume{
		FileURL:   fileURL,
		FileName:  header.Filename,
		UpdatedAt: time.Now(),
	}

	if err := s.resumeRepo.Upsert(resume); err != nil {
		return nil, fmt.Errorf("failed to save resume record: %w", err)
	}

	return &ResumeResponse{
		ID:        resume.ID,
		FileURL:   resume.FileURL,
		FileName:  resume.FileName,
		UpdatedAt: resume.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
