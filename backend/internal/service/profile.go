package service

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/minio/minio-go/v7"
)

type ProfileService struct {
	profileRepo *repository.ProfileRepository
	minioClient *minio.Client
	cfg         *config.Config
}

func NewProfileService(profileRepo *repository.ProfileRepository, minioClient *minio.Client, cfg *config.Config) *ProfileService {
	return &ProfileService{
		profileRepo: profileRepo,
		minioClient: minioClient,
		cfg:         cfg,
	}
}

type ProfileResponse struct {
	ID          uint     `json:"id"`
	Name        string   `json:"name"`
	Title       string   `json:"title"`
	Bio         string   `json:"bio"`
	AvatarURL   string   `json:"avatarUrl"`
	GithubURL   string   `json:"githubUrl"`
	LinkedinURL string   `json:"linkedinUrl"`
	Email       string   `json:"email"`
	Skills      []string `json:"skills"`
	UpdatedAt   string   `json:"updatedAt"`
}

type UpdateProfileRequest struct {
	Name        string   `json:"name"`
	Title       string   `json:"title"`
	Bio         string   `json:"bio"`
	GithubURL   string   `json:"githubUrl"`
	LinkedinURL string   `json:"linkedinUrl"`
	Email       string   `json:"email"`
	Skills      []string `json:"skills"`
}

func (s *ProfileService) GetProfile() (*ProfileResponse, error) {
	profile, err := s.profileRepo.GetProfile()
	if err != nil {
		return nil, err
	}

	return &ProfileResponse{
		ID:          profile.ID,
		Name:        profile.Name,
		Title:       profile.Title,
		Bio:         profile.Bio,
		AvatarURL:   profile.AvatarURL,
		GithubURL:   profile.GithubURL,
		LinkedinURL: profile.LinkedinURL,
		Email:       profile.Email,
		Skills:      profile.Skills,
		UpdatedAt:   profile.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *ProfileService) UpdateProfile(req *UpdateProfileRequest) (*ProfileResponse, error) {
	profile, err := s.profileRepo.GetProfile()
	if err != nil {
		// Create a new profile if none exists
		profile = &model.Profile{}
	}

	if req.Name != "" {
		profile.Name = req.Name
	}
	if req.Title != "" {
		profile.Title = req.Title
	}
	if req.Bio != "" {
		profile.Bio = req.Bio
	}
	if req.GithubURL != "" {
		profile.GithubURL = req.GithubURL
	}
	if req.LinkedinURL != "" {
		profile.LinkedinURL = req.LinkedinURL
	}
	if req.Email != "" {
		profile.Email = req.Email
	}
	if req.Skills != nil {
		profile.Skills = req.Skills
	}
	profile.UpdatedAt = time.Now()

	if err := s.profileRepo.UpsertProfile(profile); err != nil {
		return nil, err
	}

	return &ProfileResponse{
		ID:          profile.ID,
		Name:        profile.Name,
		Title:       profile.Title,
		Bio:         profile.Bio,
		AvatarURL:   profile.AvatarURL,
		GithubURL:   profile.GithubURL,
		LinkedinURL: profile.LinkedinURL,
		Email:       profile.Email,
		Skills:      profile.Skills,
		UpdatedAt:   profile.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *ProfileService) UploadAvatar(file multipart.File, header *multipart.FileHeader) (string, error) {
	if s.minioClient == nil {
		return "", fmt.Errorf("MinIO client not initialized")
	}

	processedData, contentType, err := processAvatar(file)
	if err != nil {
		return "", fmt.Errorf("process avatar: %w", err)
	}

	ext := ".jpg"
	if contentType == "image/png" {
		ext = ".png"
	}
	objectName := fmt.Sprintf("avatars/profile%s", ext)

	ctx := context.Background()
	reader := bytes.NewReader(processedData)

	_, err = s.minioClient.PutObject(ctx, s.cfg.MinIO.Bucket, objectName, reader, int64(len(processedData)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload avatar to MinIO: %w", err)
	}

	avatarURL := fmt.Sprintf("/api/files/%s", objectName)

	if err := s.profileRepo.UpdateAvatar(avatarURL); err != nil {
		return "", fmt.Errorf("failed to update avatar URL: %w", err)
	}

	return avatarURL, nil
}
