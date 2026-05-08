package model

import (
	"time"

	"github.com/lib/pq"
)

type Project struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"column:name;not null;default:''" json:"name"`
	Type        string         `gorm:"column:type;default:'enterprise';not null;check:type IN ('enterprise', 'personal')" json:"type"`
	StartDate   *time.Time     `gorm:"column:start_date;type:date" json:"start_date,omitempty"`
	EndDate     *time.Time     `gorm:"column:end_date;type:date" json:"end_date,omitempty"`
	Summary     string         `gorm:"column:summary;not null;default:''" json:"summary"`
	Description string         `gorm:"column:description;not null;default:''" json:"description"`
	CoverImage  string         `gorm:"column:cover_image;not null;default:''" json:"cover_image"`
	Images      pq.StringArray `gorm:"column:images;type:text[];default:'{}'" json:"images"`
	GitHubURL   string         `gorm:"column:github_url;not null;default:''" json:"github_url"`
	DemoURL     string         `gorm:"column:demo_url;not null;default:''" json:"demo_url"`
	Tags        pq.StringArray `gorm:"column:tags;type:varchar(50)[];default:'{}'" json:"tags"`
	SortOrder   int            `gorm:"column:sort_order;default:0" json:"sort_order"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updated_at"`
}

func (Project) TableName() string {
	return "projects"
}
