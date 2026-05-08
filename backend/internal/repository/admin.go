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

func (r *AdminRepository) UpdateEmail(id uint, email string) error {
	return r.db.Model(&model.Admin{}).Where("id = ?", id).Update("notification_email", email).Error
}
