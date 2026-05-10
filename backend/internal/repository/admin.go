package repository

import (
	"portfolio-backend/internal/model"
	"gorm.io/gorm"
)

type AdminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) *AdminRepository {
	return &AdminRepository{db: db}
}

func (r *AdminRepository) FindFirst() (*model.Admin, error) {
	var admin model.Admin
	if err := r.db.First(&admin).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *AdminRepository) FindByID(id uint) (*model.Admin, error) {
	var admin model.Admin
	if err := r.db.First(&admin, id).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *AdminRepository) Create(admin *model.Admin) error {
	return r.db.Create(admin).Error
}

func (r *AdminRepository) Count() (int64, error) {
	var count int64
	if err := r.db.Model(&model.Admin{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *AdminRepository) UpdateEmail(id uint, email string) error {
	return r.db.Model(&model.Admin{}).Where("id = ?", id).Update("notification_email", email).Error
}
