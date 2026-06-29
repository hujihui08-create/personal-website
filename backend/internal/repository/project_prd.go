package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type ProjectPrdRepository struct {
	db *gorm.DB
}

func NewProjectPrdRepository(db *gorm.DB) *ProjectPrdRepository {
	return &ProjectPrdRepository{db: db}
}

func (r *ProjectPrdRepository) Create(prd *model.ProjectPrd) error {
	return r.db.Create(prd).Error
}

func (r *ProjectPrdRepository) FindByProjectID(projectID uint) ([]model.ProjectPrd, error) {
	var prds []model.ProjectPrd
	if err := r.db.Where("project_id = ?", projectID).
		Preload("Prototype").
		Order("sort_order ASC").
		Find(&prds).Error; err != nil {
		return nil, err
	}
	return prds, nil
}

func (r *ProjectPrdRepository) FindByID(id uint) (*model.ProjectPrd, error) {
	var prd model.ProjectPrd
	if err := r.db.Preload("Prototype").First(&prd, id).Error; err != nil {
		return nil, err
	}
	return &prd, nil
}

func (r *ProjectPrdRepository) Update(prd *model.ProjectPrd) error {
	return r.db.Save(prd).Error
}

func (r *ProjectPrdRepository) Delete(id uint) error {
	return r.db.Delete(&model.ProjectPrd{}, id).Error
}

func (r *ProjectPrdRepository) DeleteByProjectID(projectID uint) error {
	return r.db.Where("project_id = ?", projectID).Delete(&model.ProjectPrd{}).Error
}

func (r *ProjectPrdRepository) UpdateSortOrder(id uint, sortOrder int) error {
	return r.db.Model(&model.ProjectPrd{}).Where("id = ?", id).Update("sort_order", sortOrder).Error
}

func (r *ProjectPrdRepository) GetMaxSortOrder(projectID uint) (int, error) {
	var maxSort int
	if err := r.db.Model(&model.ProjectPrd{}).
		Where("project_id = ?", projectID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxSort).Error; err != nil {
		return 0, err
	}
	return maxSort, nil
}
