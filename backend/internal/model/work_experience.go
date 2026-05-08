package model

import "time"

type WorkExperience struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Type        string     `gorm:"column:type;default:'work';not null" json:"type"`
	CompanyName string     `gorm:"column:company_name;not null" json:"company_name"`
	Position    string     `gorm:"column:position;not null" json:"position"`
	StartDate   time.Time  `gorm:"column:start_date;not null;type:date" json:"start_date"`
	EndDate     *time.Time `gorm:"column:end_date;type:date" json:"end_date,omitempty"`
	Description string     `gorm:"column:description;not null;default:''" json:"description"`
	SortOrder   int        `gorm:"column:sort_order;default:0" json:"sort_order"`
	Projects    []Project  `gorm:"many2many:experience_projects;foreignKey:id;joinForeignKey:experience_id;References:id;joinReferences:project_id" json:"projects,omitempty"`
	CreatedAt   time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (WorkExperience) TableName() string {
	return "work_experiences"
}

type ExperienceProject struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	ExperienceID uint `gorm:"column:experience_id;not null;index" json:"experience_id"`
	ProjectID    uint `gorm:"column:project_id;not null;index" json:"project_id"`
	SortOrder    int  `gorm:"column:sort_order;default:0" json:"sort_order"`
}

func (ExperienceProject) TableName() string {
	return "experience_projects"
}
