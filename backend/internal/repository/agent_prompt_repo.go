package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type AgentPromptRepo struct {
	db *gorm.DB
}

func NewAgentPromptRepo(db *gorm.DB) *AgentPromptRepo {
	return &AgentPromptRepo{db: db}
}

func (r *AgentPromptRepo) FindAll(agentType string, page, pageSize int) ([]model.AgentPrompt, int64, error) {
	var prompts []model.AgentPrompt
	var total int64

	query := r.db.Model(&model.AgentPrompt{})

	if agentType != "" {
		query = query.Where("agent_type = ?", agentType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("is_default DESC, created_at DESC").Offset(offset).Limit(pageSize).Find(&prompts).Error; err != nil {
		return nil, 0, err
	}

	return prompts, total, nil
}

func (r *AgentPromptRepo) FindByID(id uint) (*model.AgentPrompt, error) {
	var prompt model.AgentPrompt
	if err := r.db.First(&prompt, id).Error; err != nil {
		return nil, err
	}
	return &prompt, nil
}

func (r *AgentPromptRepo) FindByAgentType(agentType string) ([]model.AgentPrompt, error) {
	var prompts []model.AgentPrompt
	if err := r.db.Where("agent_type = ?", agentType).Find(&prompts).Error; err != nil {
		return nil, err
	}
	return prompts, nil
}

func (r *AgentPromptRepo) FindDefaultByAgentType(agentType string) (*model.AgentPrompt, error) {
	var prompt model.AgentPrompt
	if err := r.db.Where("agent_type = ? AND is_default = ? AND is_active = ?", agentType, true, true).First(&prompt).Error; err != nil {
		return nil, err
	}
	return &prompt, nil
}

func (r *AgentPromptRepo) Create(prompt *model.AgentPrompt) error {
	return r.db.Create(prompt).Error
}

func (r *AgentPromptRepo) Update(prompt *model.AgentPrompt) error {
	return r.db.Save(prompt).Error
}

func (r *AgentPromptRepo) Delete(id uint) error {
	return r.db.Delete(&model.AgentPrompt{}, id).Error
}

func (r *AgentPromptRepo) SetDefault(agentType string, promptID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.AgentPrompt{}).Where("agent_type = ?", agentType).Update("is_default", false).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.AgentPrompt{}).Where("id = ?", promptID).Update("is_default", true).Error; err != nil {
			return err
		}

		return nil
	})
}
