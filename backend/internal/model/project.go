package model

import "time"

type Project struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Title         string    `gorm:"column:title;not null;default:''" json:"title"`
	Description   string    `gorm:"column:description;not null;default:''" json:"description"`
	CoverImageURL string    `gorm:"column:cover_image_url;not null;default:''" json:"cover_image_url"`
	LiveURL       string    `gorm:"column:live_url;not null;default:''" json:"live_url"`
	SourceURL     string    `gorm:"column:source_url;not null;default:''" json:"source_url"`
	SortOrder     int       `gorm:"column:sort_order;default:0" json:"sort_order"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Project) TableName() string {
	return "projects"
}
