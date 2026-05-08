package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type ResumeRepository struct {
	db *gorm.DB
}

func NewResumeRepository(db *gorm.DB) *ResumeRepository {
	return &ResumeRepository{db: db}
}

func (r *ResumeRepository) GetLatest() (*model.Resume, error) {
	var resume model.Resume
	if err := r.db.Last(&resume).Error; err != nil {
		return nil, err
	}
	return &resume, nil
}

func (r *ResumeRepository) Upsert(resume *model.Resume) error {
	var count int64
	r.db.Model(&model.Resume{}).Count(&count)
	if count == 0 {
		return r.db.Create(resume).Error
	}
	// Update the existing record
	var existing model.Resume
	if err := r.db.First(&existing).Error; err != nil {
		return err
	}
	resume.ID = existing.ID
	return r.db.Model(&model.Resume{}).Where("id = ?", existing.ID).Updates(resume).Error
}
