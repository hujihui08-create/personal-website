package model

import "time"

type AgentIntent struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"unique;not null;size:50" json:"name"`
	Label     string    `gorm:"size:100" json:"label"`
	Keywords  string    `gorm:"type:text;not null" json:"keywords"`
	SortOrder int       `gorm:"column:sort_order;default:0" json:"sort_order"`
	PromptID  *uint     `gorm:"column:prompt_id" json:"prompt_id"`
	IsActive  bool      `gorm:"column:is_active;default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;default:now()" json:"updated_at"`
}

func (AgentIntent) TableName() string {
	return "agent_intents"
}
