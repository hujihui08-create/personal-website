package repository

import (
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(notification *model.Notification) error {
	return r.db.Create(notification).Error
}

func (r *NotificationRepository) List(page, pageSize int) ([]model.Notification, int64, error) {
	var notifications []model.Notification
	var total int64

	offset := (page - 1) * pageSize

	err := r.db.Model(&model.Notification{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&notifications).Error
	if err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *NotificationRepository) MarkAsRead(id uint) error {
	return r.db.Model(&model.Notification{}).Where("id = ?", id).Update("is_read", true).Error
}

func (r *NotificationRepository) MarkAllAsRead() error {
	return r.db.Model(&model.Notification{}).Where("is_read = ?", false).Update("is_read", true).Error
}

func (r *NotificationRepository) CountUnread() (int64, error) {
	var count int64
	err := r.db.Model(&model.Notification{}).Where("is_read = ?", false).Count(&count).Error
	return count, err
}
