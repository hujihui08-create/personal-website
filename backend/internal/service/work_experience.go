package service

import (
	"fmt"
	"time"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type ExperienceService struct {
	experienceRepo *repository.WorkExperienceRepository
}

func NewExperienceService(experienceRepo *repository.WorkExperienceRepository) *ExperienceService {
	return &ExperienceService{
		experienceRepo: experienceRepo,
	}
}

type ProjectBrief struct {
	ID            uint   `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	LiveURL       string `json:"live_url"`
	SourceURL     string `json:"source_url"`
}

type ExperienceResponse struct {
	ID          uint           `json:"id"`
	CompanyName string         `json:"company_name"`
	Position    string         `json:"position"`
	StartDate   string         `json:"start_date"`
	EndDate     *string        `json:"end_date,omitempty"`
	Description string         `json:"description"`
	SortOrder   int            `json:"sort_order"`
	Projects    []ProjectBrief `json:"projects,omitempty"`
	CreatedAt   string         `json:"created_at"`
	UpdatedAt   string         `json:"updated_at"`
}

type CreateExperienceRequest struct {
	CompanyName string  `json:"company_name" binding:"required"`
	Position    string  `json:"position" binding:"required"`
	StartDate   string  `json:"start_date" binding:"required"`
	EndDate     *string `json:"end_date,omitempty"`
	Description string  `json:"description"`
	SortOrder   int     `json:"sort_order"`
}

type UpdateExperienceRequest struct {
	CompanyName *string `json:"company_name"`
	Position    *string `json:"position"`
	StartDate   *string `json:"start_date"`
	EndDate     *string `json:"end_date,omitempty"`
	Description *string `json:"description"`
	SortOrder   *int    `json:"sort_order"`
}

type ReorderRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

func toExperienceResponse(exp *model.WorkExperience) *ExperienceResponse {
	resp := &ExperienceResponse{
		ID:          exp.ID,
		CompanyName: exp.CompanyName,
		Position:    exp.Position,
		StartDate:   exp.StartDate.Format("2006-01-02"),
		Description: exp.Description,
		SortOrder:   exp.SortOrder,
		CreatedAt:   exp.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   exp.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	if exp.EndDate != nil {
		endDate := exp.EndDate.Format("2006-01-02")
		resp.EndDate = &endDate
	}

	if exp.Projects != nil {
		projects := make([]ProjectBrief, 0, len(exp.Projects))
		for _, p := range exp.Projects {
			projects = append(projects, ProjectBrief{
				ID:            p.ID,
				Title:         p.Title,
				Description:   p.Description,
				CoverImageURL: p.CoverImageURL,
				LiveURL:       p.LiveURL,
				SourceURL:     p.SourceURL,
			})
		}
		resp.Projects = projects
	}

	return resp
}

func (s *ExperienceService) List() ([]*ExperienceResponse, error) {
	experiences, err := s.experienceRepo.List()
	if err != nil {
		return nil, err
	}

	responses := make([]*ExperienceResponse, 0, len(experiences))
	for i := range experiences {
		responses = append(responses, toExperienceResponse(&experiences[i]))
	}
	return responses, nil
}

func (s *ExperienceService) Create(req *CreateExperienceRequest) (*ExperienceResponse, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
		}
		endDate = &parsed
	}

	exp := &model.WorkExperience{
		CompanyName: req.CompanyName,
		Position:    req.Position,
		StartDate:   startDate,
		EndDate:     endDate,
		Description: req.Description,
		SortOrder:   req.SortOrder,
	}

	if err := s.experienceRepo.Create(exp); err != nil {
		return nil, err
	}

	return toExperienceResponse(exp), nil
}

func (s *ExperienceService) Update(id uint, req *UpdateExperienceRequest) (*ExperienceResponse, error) {
	exp, err := s.experienceRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("experience not found: %w", err)
	}

	if req.CompanyName != nil {
		exp.CompanyName = *req.CompanyName
	}
	if req.Position != nil {
		exp.Position = *req.Position
	}
	if req.StartDate != nil {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
		}
		exp.StartDate = parsed
	}
	if req.EndDate != nil {
		if *req.EndDate == "" {
			exp.EndDate = nil
		} else {
			parsed, err := time.Parse("2006-01-02", *req.EndDate)
			if err != nil {
				return nil, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
			}
			exp.EndDate = &parsed
		}
	}
	if req.Description != nil {
		exp.Description = *req.Description
	}
	if req.SortOrder != nil {
		exp.SortOrder = *req.SortOrder
	}

	if err := s.experienceRepo.Update(exp); err != nil {
		return nil, err
	}

	return toExperienceResponse(exp), nil
}

func (s *ExperienceService) Delete(id uint) error {
	return s.experienceRepo.Delete(id)
}

func (s *ExperienceService) Reorder(ids []uint) error {
	return s.experienceRepo.Reorder(ids)
}
