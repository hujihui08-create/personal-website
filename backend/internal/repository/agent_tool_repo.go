package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type AgentToolRepo struct {
	db *gorm.DB
}

func NewAgentToolRepo(db *gorm.DB) *AgentToolRepo {
	return &AgentToolRepo{db: db}
}

func (r *AgentToolRepo) FindAll() ([]model.AgentTool, error) {
	var tools []model.AgentTool
	if err := r.db.Order("id ASC").Find(&tools).Error; err != nil {
		return nil, err
	}
	return tools, nil
}

func (r *AgentToolRepo) FindActive() ([]model.AgentTool, error) {
	var tools []model.AgentTool
	if err := r.db.Where("is_active = ?", true).Order("id ASC").Find(&tools).Error; err != nil {
		return nil, err
	}
	return tools, nil
}

func (r *AgentToolRepo) FindByName(name string) (*model.AgentTool, error) {
	var tool model.AgentTool
	if err := r.db.Where("name = ?", name).First(&tool).Error; err != nil {
		return nil, err
	}
	return &tool, nil
}

func (r *AgentToolRepo) UpdateActive(name string, active bool) error {
	return r.db.Model(&model.AgentTool{}).Where("name = ?", name).Update("is_active", active).Error
}
