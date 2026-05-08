package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type ProfileRepository struct {
	db *gorm.DB
}

func NewProfileRepository(db *gorm.DB) *ProfileRepository {
	return &ProfileRepository{db: db}
}

func (r *ProfileRepository) GetProfile() (*model.Profile, error) {
	var profile model.Profile
	if err := r.db.First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *ProfileRepository) UpsertProfile(profile *model.Profile) error {
	var count int64
	r.db.Model(&model.Profile{}).Count(&count)
	if count == 0 {
		return r.db.Create(profile).Error
	}
	return r.db.Model(&model.Profile{}).Where("id = ?", profile.ID).Updates(profile).Error
}

func (r *ProfileRepository) UpdateAvatar(avatarURL string) error {
	return r.db.Model(&model.Profile{}).Where("1 = 1").Update("avatar_url", avatarURL).Error
}
