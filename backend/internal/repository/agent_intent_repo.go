package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type AgentIntentRepo struct {
	db *gorm.DB
}

func NewAgentIntentRepo(db *gorm.DB) *AgentIntentRepo {
	return &AgentIntentRepo{db: db}
}

func (r *AgentIntentRepo) FindAll() ([]model.AgentIntent, error) {
	var intents []model.AgentIntent
	if err := r.db.Order("sort_order ASC").Find(&intents).Error; err != nil {
		return nil, err
	}
	return intents, nil
}

func (r *AgentIntentRepo) FindActive() ([]model.AgentIntent, error) {
	var intents []model.AgentIntent
	if err := r.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&intents).Error; err != nil {
		return nil, err
	}
	return intents, nil
}

func (r *AgentIntentRepo) FindByID(id uint) (*model.AgentIntent, error) {
	var intent model.AgentIntent
	if err := r.db.First(&intent, id).Error; err != nil {
		return nil, err
	}
	return &intent, nil
}

func (r *AgentIntentRepo) Create(intent *model.AgentIntent) error {
	return r.db.Create(intent).Error
}

func (r *AgentIntentRepo) Update(intent *model.AgentIntent) error {
	return r.db.Save(intent).Error
}

func (r *AgentIntentRepo) Delete(id uint) error {
	return r.db.Delete(&model.AgentIntent{}, id).Error
}

func (r *AgentIntentRepo) UpdateSortOrder(id uint, sortOrder int) error {
	return r.db.Model(&model.AgentIntent{}).Where("id = ?", id).Update("sort_order", sortOrder).Error
}
