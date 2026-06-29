package model

import "time"

type ProjectPrd struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProjectID   uint      `gorm:"column:project_id;not null;index" json:"project_id"`
	Name        string    `gorm:"column:name;size:200;not null" json:"name"`
	PrdURL      string    `gorm:"column:prd_url;size:1000;default:''" json:"prd_url"`
	PrototypeID *uint     `gorm:"column:prototype_id" json:"prototype_id,omitempty"`
	SortOrder   int       `gorm:"column:sort_order;default:0" json:"sort_order"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updated_at"`
	// 关联
	Prototype *Prototype `gorm:"foreignKey:PrototypeID" json:"prototype,omitempty"`
}

func (ProjectPrd) TableName() string {
	return "project_prds"
}
