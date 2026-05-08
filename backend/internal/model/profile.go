package model

import (
	"time"

	"github.com/lib/pq"
)

type Profile struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"column:name;not null;default:''" json:"name"`
	Title       string         `gorm:"column:title;not null;default:''" json:"title"`
	Bio         string         `gorm:"column:bio;not null;default:''" json:"bio"`
	AvatarURL   string         `gorm:"column:avatar_url;not null;default:''" json:"avatar_url"`
	GithubURL   string         `gorm:"column:github_url;not null;default:''" json:"github_url"`
	LinkedinURL string         `gorm:"column:linkedin_url;not null;default:''" json:"linkedin_url"`
	Email       string         `gorm:"column:email;not null;default:''" json:"email"`
	Skills      pq.StringArray `gorm:"column:skills;type:text[];not null;default:'{}'" json:"skills"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updated_at"`
}

func (Profile) TableName() string {
	return "profiles"
}
