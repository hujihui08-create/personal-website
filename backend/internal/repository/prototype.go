package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type PrototypeRepository struct {
	db *gorm.DB
}

func NewPrototypeRepository(db *gorm.DB) *PrototypeRepository {
	return &PrototypeRepository{db: db}
}

func (r *PrototypeRepository) Create(prototype *model.Prototype) error {
	return r.db.Create(prototype).Error
}

func (r *PrototypeRepository) FindByID(id uint) (*model.Prototype, error) {
	var prototype model.Prototype
	if err := r.db.First(&prototype, id).Error; err != nil {
		return nil, err
	}
	return &prototype, nil
}

func (r *PrototypeRepository) FindAll() ([]model.Prototype, error) {
	var prototypes []model.Prototype
	if err := r.db.Order("created_at DESC").Find(&prototypes).Error; err != nil {
		return nil, err
	}
	return prototypes, nil
}

func (r *PrototypeRepository) Update(prototype *model.Prototype) error {
	return r.db.Save(prototype).Error
}

func (r *PrototypeRepository) Delete(id uint) error {
	return r.db.Delete(&model.Prototype{}, id).Error
}
