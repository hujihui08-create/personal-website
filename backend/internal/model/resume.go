package model

import "time"

type Resume struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FileURL   string    `gorm:"column:file_url;not null;default:''" json:"file_url"`
	FileName  string    `gorm:"column:file_name;not null;default:''" json:"file_name"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Resume) TableName() string {
	return "resumes"
}
