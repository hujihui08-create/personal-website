package model

import (
	"time"
)

type Prototype struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"column:name;not null;default:''" json:"name"`
	StoragePrefix string    `gorm:"column:storage_prefix;not null;default:''" json:"storage_prefix"`
	FileCount     int       `gorm:"column:file_count;not null;default:0" json:"file_count"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Prototype) TableName() string {
	return "prototypes"
}
