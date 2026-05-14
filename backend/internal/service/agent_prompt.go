package service

import (
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type AgentPromptService struct {
	promptRepo *repository.AgentPromptRepo
}

func NewAgentPromptService(promptRepo *repository.AgentPromptRepo) *AgentPromptService {
	return &AgentPromptService{
		promptRepo: promptRepo,
	}
}

type PromptCreateRequest struct {
	AgentType       string `json:"agent_type" binding:"required"`
	Name            string `json:"name" binding:"required"`
	SystemPrompt    string `json:"system_prompt" binding:"required"`
	ContextTemplate string `json:"context_template"`
}

type PromptUpdateRequest struct {
	Name            *string `json:"name"`
	SystemPrompt    *string `json:"system_prompt"`
	ContextTemplate *string `json:"context_template"`
	IsActive        *bool   `json:"is_active"`
}

func (s *AgentPromptService) ListPrompts(agentType string, page, pageSize int) ([]model.AgentPrompt, int64, error) {
	return s.promptRepo.FindAll(agentType, page, pageSize)
}

func (s *AgentPromptService) GetPrompt(id uint) (*model.AgentPrompt, error) {
	return s.promptRepo.FindByID(id)
}

func (s *AgentPromptService) CreatePrompt(adminID uint, req PromptCreateRequest) (*model.AgentPrompt, error) {
	prompt := &model.AgentPrompt{
		AgentType:       req.AgentType,
		Name:            req.Name,
		SystemPrompt:    req.SystemPrompt,
		ContextTemplate: req.ContextTemplate,
		CreatedBy:       &adminID,
	}

	if err := s.promptRepo.Create(prompt); err != nil {
		return nil, err
	}

	return prompt, nil
}

func (s *AgentPromptService) UpdatePrompt(id uint, req PromptUpdateRequest) (*model.AgentPrompt, error) {
	prompt, err := s.promptRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		prompt.Name = *req.Name
	}
	if req.SystemPrompt != nil {
		prompt.SystemPrompt = *req.SystemPrompt
	}
	if req.ContextTemplate != nil {
		prompt.ContextTemplate = *req.ContextTemplate
	}
	if req.IsActive != nil {
		prompt.IsActive = *req.IsActive
	}

	if err := s.promptRepo.Update(prompt); err != nil {
		return nil, err
	}

	return prompt, nil
}

func (s *AgentPromptService) DeletePrompt(id uint) error {
	return s.promptRepo.Delete(id)
}

func (s *AgentPromptService) SetDefaultPrompt(agentType string, promptID uint) error {
	return s.promptRepo.SetDefault(agentType, promptID)
}
