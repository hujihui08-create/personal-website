package service

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"portfolio-backend/internal/config"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type ProjectService struct {
	projectRepo    *repository.ProjectRepository
	projectPrdRepo *repository.ProjectPrdRepository
	minioClient    *minio.Client
	cfg            *config.Config
}

func NewProjectService(
	projectRepo *repository.ProjectRepository,
	projectPrdRepo *repository.ProjectPrdRepository,
	minioClient *minio.Client,
	cfg *config.Config,
) *ProjectService {
	return &ProjectService{
		projectRepo:    projectRepo,
		projectPrdRepo: projectPrdRepo,
		minioClient:    minioClient,
		cfg:            cfg,
	}
}

type ProjectPrdResponse struct {
	ID          uint                `json:"id"`
	Name        string              `json:"name"`
	PrdURL      string              `json:"prd_url"`
	PrototypeID *uint               `json:"prototype_id,omitempty"`
	SortOrder   int                 `json:"sort_order"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
	Prototype   *model.Prototype    `json:"prototype,omitempty"`
}

type ProjectResponse struct {
	ID          uint                 `json:"id"`
	Name        string               `json:"name"`
	Type        string               `json:"type"`
	StartDate   *string              `json:"startDate,omitempty"`
	EndDate     *string              `json:"endDate,omitempty"`
	Summary     string               `json:"summary"`
	Description string               `json:"description"`
	CoverImage  string               `json:"coverImage"`
	Images      []string             `json:"images"`
	GitHubURL   string               `json:"githubUrl"`
	DemoURL     string               `json:"demoUrl"`
	Tags        []string             `json:"tags"`
	IsFeatured  bool                 `json:"isFeatured"`
	SortOrder   int                  `json:"sortOrder"`
	PRDs        []ProjectPrdResponse `json:"prds,omitempty"`
	CreatedAt   time.Time            `json:"createdAt"`
	UpdatedAt   time.Time            `json:"updatedAt"`
}

type PaginatedProjectsResponse struct {
	Items    []ProjectResponse `json:"items"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

type CreateProjectRequest struct {
	Name        string   `json:"name" binding:"required"`
	Type        string   `json:"type"`
	StartDate   *string  `json:"startDate,omitempty"`
	EndDate     *string  `json:"endDate,omitempty"`
	Summary     string   `json:"summary"`
	Description string   `json:"description"`
	CoverImage  string   `json:"coverImage"`
	Images      []string `json:"images"`
	GitHubURL   string   `json:"githubUrl"`
	DemoURL     string   `json:"demoUrl"`
	Tags        []string `json:"tags"`
	IsFeatured  bool     `json:"isFeatured"`
	SortOrder   int      `json:"sortOrder"`
}

type UpdateProjectRequest struct {
	Name        *string   `json:"name"`
	Type        *string   `json:"type"`
	StartDate   **string  `json:"startDate,omitempty"`
	EndDate     **string  `json:"endDate,omitempty"`
	Summary     *string   `json:"summary"`
	Description *string   `json:"description"`
	CoverImage  *string   `json:"coverImage"`
	Images      *[]string `json:"images"`
	GitHubURL   *string   `json:"githubUrl"`
	DemoURL     *string   `json:"demoUrl"`
	Tags        *[]string `json:"tags"`
	IsFeatured  *bool     `json:"isFeatured"`
	SortOrder   *int      `json:"sortOrder"`
}

func toProjectResponse(project *model.Project) *ProjectResponse {
	resp := &ProjectResponse{
		ID:          project.ID,
		Name:        project.Name,
		Type:        project.Type,
		Summary:     project.Summary,
		Description: project.Description,
		CoverImage:  project.CoverImage,
		Images:      []string(project.Images),
		GitHubURL:   project.GitHubURL,
		DemoURL:     project.DemoURL,
		Tags:        []string(project.Tags),
		IsFeatured:  project.IsFeatured,
		SortOrder:   project.SortOrder,
		CreatedAt:   project.CreatedAt,
		UpdatedAt:   project.UpdatedAt,
	}

	if project.StartDate != nil {
		startDate := project.StartDate.Format("2006-01-02")
		resp.StartDate = &startDate
	}

	if project.EndDate != nil {
		endDate := project.EndDate.Format("2006-01-02")
		resp.EndDate = &endDate
	}

	// 映射 PRDs
	if len(project.PRDs) > 0 {
		prds := make([]ProjectPrdResponse, 0, len(project.PRDs))
		for _, prd := range project.PRDs {
			prdResp := ProjectPrdResponse{
				ID:          prd.ID,
				Name:        prd.Name,
				PrdURL:      prd.PrdURL,
				PrototypeID: prd.PrototypeID,
				SortOrder:   prd.SortOrder,
				CreatedAt:   prd.CreatedAt,
				UpdatedAt:   prd.UpdatedAt,
			}
			if prd.Prototype != nil {
				prdResp.Prototype = prd.Prototype
			}
			prds = append(prds, prdResp)
		}
		resp.PRDs = prds
	}

	return resp
}

func (s *ProjectService) List(projectType string, page int, pageSize int) (*PaginatedProjectsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	projects, total, err := s.projectRepo.List(repository.ListProjectsOptions{
		Type:     projectType,
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		return nil, err
	}

	items := make([]ProjectResponse, 0, len(projects))
	for i := range projects {
		items = append(items, *toProjectResponse(&projects[i]))
	}

	return &PaginatedProjectsResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *ProjectService) ListFeatured(limit int) ([]ProjectResponse, error) {
	if limit < 1 {
		limit = 4
	}

	projects, err := s.projectRepo.ListFeatured(limit)
	if err != nil {
		return nil, err
	}

	items := make([]ProjectResponse, 0, len(projects))
	for i := range projects {
		items = append(items, *toProjectResponse(&projects[i]))
	}

	return items, nil
}

func (s *ProjectService) GetByID(id uint) (*ProjectResponse, error) {
	project, err := s.projectRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	return toProjectResponse(project), nil
}

func (s *ProjectService) Create(req *CreateProjectRequest) (*ProjectResponse, error) {
	var startDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
		}
		startDate = &parsed
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
		}
		endDate = &parsed
	}

	projectType := req.Type
	if projectType == "" {
		projectType = "enterprise"
	}

	project := &model.Project{
		Name:        req.Name,
		Type:        projectType,
		StartDate:   startDate,
		EndDate:     endDate,
		Summary:     req.Summary,
		Description: req.Description,
		CoverImage:  req.CoverImage,
		Images:      pq.StringArray(req.Images),
		GitHubURL:   req.GitHubURL,
		DemoURL:     req.DemoURL,
		Tags:        pq.StringArray(req.Tags),
		IsFeatured:  req.IsFeatured,
		SortOrder:   req.SortOrder,
	}

	if err := s.projectRepo.Create(project); err != nil {
		return nil, err
	}

	return toProjectResponse(project), nil
}

func (s *ProjectService) Update(id uint, req *UpdateProjectRequest) (*ProjectResponse, error) {
	project, err := s.projectRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.Type != nil {
		project.Type = *req.Type
	}
	if req.StartDate != nil {
		if **req.StartDate == "" {
			project.StartDate = nil
		} else {
			parsed, err := time.Parse("2006-01-02", **req.StartDate)
			if err != nil {
				return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
			}
			project.StartDate = &parsed
		}
	}
	if req.EndDate != nil {
		if **req.EndDate == "" {
			project.EndDate = nil
		} else {
			parsed, err := time.Parse("2006-01-02", **req.EndDate)
			if err != nil {
				return nil, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
			}
			project.EndDate = &parsed
		}
	}
	if req.Summary != nil {
		project.Summary = *req.Summary
	}
	if req.Description != nil {
		project.Description = *req.Description
	}
	if req.CoverImage != nil {
		project.CoverImage = *req.CoverImage
	}
	if req.Images != nil {
		project.Images = pq.StringArray(*req.Images)
	}
	if req.GitHubURL != nil {
		project.GitHubURL = *req.GitHubURL
	}
	if req.DemoURL != nil {
		project.DemoURL = *req.DemoURL
	}
	if req.Tags != nil {
		project.Tags = pq.StringArray(*req.Tags)
	}
	if req.IsFeatured != nil {
		project.IsFeatured = *req.IsFeatured
	}
	if req.SortOrder != nil {
		project.SortOrder = *req.SortOrder
	}

	if err := s.projectRepo.Update(project); err != nil {
		return nil, err
	}

	return toProjectResponse(project), nil
}

func (s *ProjectService) Delete(id uint) error {
	return s.projectRepo.Delete(id)
}

func (s *ProjectService) ToggleFeatured(id uint) (*ProjectResponse, error) {
	project, err := s.projectRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	project.IsFeatured = !project.IsFeatured
	if err := s.projectRepo.Update(project); err != nil {
		return nil, fmt.Errorf("failed to toggle featured: %w", err)
	}

	return toProjectResponse(project), nil
}

func (s *ProjectService) Reorder(ids []uint) error {
	return s.projectRepo.Reorder(ids)
}

func (s *ProjectService) UploadCoverImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	if s.minioClient == nil {
		return "", fmt.Errorf("MinIO client not initialized")
	}

	processedData, contentType, err := processCoverImage(file)
	if err != nil {
		return "", fmt.Errorf("process cover image: %w", err)
	}

	ext := ".jpg"
	if contentType == "image/png" {
		ext = ".png"
	}
	objectName := fmt.Sprintf("projects/covers/%d%s", time.Now().UnixNano(), ext)

	ctx := context.Background()
	reader := bytes.NewReader(processedData)

	_, err = s.minioClient.PutObject(ctx, s.cfg.MinIO.Bucket, objectName, reader, int64(len(processedData)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload cover image to MinIO: %w", err)
	}

	return fmt.Sprintf("/api/files/%s", objectName), nil
}

func (s *ProjectService) UploadProjectImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	if s.minioClient == nil {
		return "", fmt.Errorf("MinIO client not initialized")
	}

	processedData, contentType, err := processProjectImage(file)
	if err != nil {
		return "", fmt.Errorf("process project image: %w", err)
	}

	ext := ".jpg"
	if contentType == "image/png" {
		ext = ".png"
	}
	objectName := fmt.Sprintf("projects/images/%d%s", time.Now().UnixNano(), ext)

	ctx := context.Background()
	reader := bytes.NewReader(processedData)

	_, err = s.minioClient.PutObject(ctx, s.cfg.MinIO.Bucket, objectName, reader, int64(len(processedData)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload project image to MinIO: %w", err)
	}

	return fmt.Sprintf("/api/files/%s", objectName), nil
}
