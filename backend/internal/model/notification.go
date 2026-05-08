package model

import "time"

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Type      string    `gorm:"column:type;not null;size:50;index:idx_notifications_type" json:"type"`
	Title     string    `gorm:"column:title;not null;size:200" json:"title"`
	Content   string    `gorm:"column:content;type:text;not null" json:"content"`
	IsRead    bool      `gorm:"column:is_read;default:false;index:idx_notifications_is_read" json:"is_read"`
	RelatedID *uint     `gorm:"column:related_id" json:"related_id,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at;index:idx_notifications_created_at desc" json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
