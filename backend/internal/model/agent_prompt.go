package model

import (
	"time"
)

type AgentPrompt struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	AgentType       string    `gorm:"type:varchar(50);not null;index" json:"agent_type"`
	Name            string    `gorm:"type:varchar(100);not null" json:"name"`
	SystemPrompt    string    `gorm:"type:text;not null" json:"system_prompt"`
	ContextTemplate string    `gorm:"type:text" json:"context_template"`
	IsDefault       bool      `gorm:"default:false" json:"is_default"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedBy       *uint     `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (AgentPrompt) TableName() string {
	return "agent_prompts"
}
