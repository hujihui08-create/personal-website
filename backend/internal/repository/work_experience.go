package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type WorkExperienceRepository struct {
	db *gorm.DB
}

func NewWorkExperienceRepository(db *gorm.DB) *WorkExperienceRepository {
	return &WorkExperienceRepository{db: db}
}

func (r *WorkExperienceRepository) List() ([]model.WorkExperience, error) {
	var experiences []model.WorkExperience
	if err := r.db.Preload("Projects").Order("sort_order DESC").Find(&experiences).Error; err != nil {
		return nil, err
	}
	return experiences, nil
}

func (r *WorkExperienceRepository) GetByID(id uint) (*model.WorkExperience, error) {
	var experience model.WorkExperience
	if err := r.db.Preload("Projects").First(&experience, id).Error; err != nil {
		return nil, err
	}
	return &experience, nil
}

func (r *WorkExperienceRepository) Create(exp *model.WorkExperience) error {
	return r.db.Create(exp).Error
}

func (r *WorkExperienceRepository) Update(exp *model.WorkExperience) error {
	return r.db.Model(&model.WorkExperience{}).Where("id = ?", exp.ID).Updates(exp).Error
}

func (r *WorkExperienceRepository) Delete(id uint) error {
	return r.db.Delete(&model.WorkExperience{}, id).Error
}

func (r *WorkExperienceRepository) Reorder(ids []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for i, id := range ids {
			sortOrder := len(ids) - 1 - i
			if err := tx.Model(&model.WorkExperience{}).Where("id = ?", id).Update("sort_order", sortOrder).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
