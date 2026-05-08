package model

import "time"

type Admin struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	PasswordHash      string    `gorm:"column:password_hash;not null" json:"-"`
	NotificationEmail string    `gorm:"column:notification_email" json:"notification_email,omitempty"`
	CreatedAt         time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt         time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Admin) TableName() string {
	return "admins"
}

type AdminResponse struct {
	ID                uint      `json:"id"`
	NotificationEmail string    `json:"notification_email,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}
