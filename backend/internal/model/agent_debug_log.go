package model

import (
	"time"

	"gorm.io/datatypes"
)

type AgentDebugLog struct {
	ID                   uint           `gorm:"primaryKey" json:"id"`
	AdminID              uint           `gorm:"not null;index" json:"admin_id"`
	Query                string         `gorm:"type:text;not null" json:"query"`
	Answer               string         `gorm:"type:text;not null" json:"answer"`
	AgentType            string         `gorm:"type:varchar(50)" json:"agent_type"`
	IntentClassification datatypes.JSON `gorm:"type:jsonb" json:"intent_classification"`
	RetrievalInfo        datatypes.JSON `gorm:"type:jsonb" json:"retrieval_info"`
	GenerationStats      datatypes.JSON `gorm:"type:jsonb" json:"generation_stats"`
	CustomPromptID       *uint          `json:"custom_prompt_id"`
	CreatedAt            time.Time      `json:"created_at"`
}

func (AgentDebugLog) TableName() string {
	return "agent_debug_logs"
}
