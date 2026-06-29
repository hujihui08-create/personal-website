package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type ProjectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

type ListProjectsOptions struct {
	Type     string
	Page     int
	PageSize int
}

func (r *ProjectRepository) List(opts ListProjectsOptions) ([]model.Project, int64, error) {
	var projects []model.Project
	var total int64

	query := r.db.Model(&model.Project{})

	if opts.Type != "" {
		query = query.Where("type = ?", opts.Type)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (opts.Page - 1) * opts.PageSize
	if err := query.Order("sort_order DESC").Offset(offset).Limit(opts.PageSize).Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func (r *ProjectRepository) ListFeatured(limit int) ([]model.Project, error) {
	var projects []model.Project
	if err := r.db.Where("is_featured = ?", true).Order("sort_order DESC").Limit(limit).Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *ProjectRepository) GetByID(id uint) (*model.Project, error) {
	var project model.Project
	if err := r.db.Preload("PRDs").Preload("PRDs.Prototype").First(&project, id).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepository) Create(project *model.Project) error {
	return r.db.Create(project).Error
}

func (r *ProjectRepository) Update(project *model.Project) error {
	return r.db.Model(&model.Project{}).Where("id = ?", project.ID).Updates(project).Error
}

func (r *ProjectRepository) Delete(id uint) error {
	return r.db.Delete(&model.Project{}, id).Error
}

func (r *ProjectRepository) Reorder(ids []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for i, id := range ids {
			sortOrder := len(ids) - 1 - i
			if err := tx.Model(&model.Project{}).Where("id = ?", id).Update("sort_order", sortOrder).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
