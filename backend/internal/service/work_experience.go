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
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Summary    string `json:"summary"`
	CoverImage string `json:"coverImage"`
	DemoURL    string `json:"demoUrl"`
	GitHubURL  string `json:"githubUrl"`
}

type ExperienceResponse struct {
	ID          uint           `json:"id"`
	Type        string         `json:"type"`
	CompanyName string         `json:"companyName"`
	Position    string         `json:"position"`
	StartDate   string         `json:"startDate"`
	EndDate     *string        `json:"endDate,omitempty"`
	Description string         `json:"description"`
	SortOrder   int            `json:"sortOrder"`
	Projects    []ProjectBrief `json:"projects,omitempty"`
	CreatedAt   string         `json:"createdAt"`
	UpdatedAt   string         `json:"updatedAt"`
}

type CreateExperienceRequest struct {
	Type        string  `json:"type"`
	CompanyName string  `json:"companyName" binding:"required"`
	Position    string  `json:"position" binding:"required"`
	StartDate   string  `json:"startDate" binding:"required"`
	EndDate     *string `json:"endDate,omitempty"`
	Description string  `json:"description"`
	SortOrder   int     `json:"sortOrder"`
}

type UpdateExperienceRequest struct {
	Type        *string `json:"type"`
	CompanyName *string `json:"companyName"`
	Position    *string `json:"position"`
	StartDate   *string `json:"startDate"`
	EndDate     *string `json:"endDate,omitempty"`
	Description *string `json:"description"`
	SortOrder   *int    `json:"sortOrder"`
}

type ReorderRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

func toExperienceResponse(exp *model.WorkExperience) *ExperienceResponse {
	resp := &ExperienceResponse{
		ID:          exp.ID,
		Type:        exp.Type,
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
				ID:         p.ID,
				Name:       p.Name,
				Summary:    p.Summary,
				CoverImage: p.CoverImage,
				DemoURL:    p.DemoURL,
				GitHubURL:  p.GitHubURL,
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

	expType := req.Type
	if expType == "" {
		expType = "work"
	}

	exp := &model.WorkExperience{
		Type:        expType,
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
	if req.Type != nil {
		exp.Type = *req.Type
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
