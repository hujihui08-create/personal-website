package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type AgentDebugLogRepo struct {
	db *gorm.DB
}

func NewAgentDebugLogRepo(db *gorm.DB) *AgentDebugLogRepo {
	return &AgentDebugLogRepo{db: db}
}

func (r *AgentDebugLogRepo) Create(log *model.AgentDebugLog) error {
	return r.db.Create(log).Error
}

func (r *AgentDebugLogRepo) FindByAdminID(adminID uint, page, pageSize int) ([]model.AgentDebugLog, int64, error) {
	var logs []model.AgentDebugLog
	var total int64

	query := r.db.Model(&model.AgentDebugLog{}).Where("admin_id = ?", adminID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *AgentDebugLogRepo) FindByID(id uint) (*model.AgentDebugLog, error) {
	var log model.AgentDebugLog
	if err := r.db.First(&log, id).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *AgentDebugLogRepo) DeleteByID(id uint) error {
	return r.db.Delete(&model.AgentDebugLog{}, id).Error
}

func (r *AgentDebugLogRepo) DeleteAllByAdminID(adminID uint) (int64, error) {
	result := r.db.Where("admin_id = ?", adminID).Delete(&model.AgentDebugLog{})
	return result.RowsAffected, result.Error
}
