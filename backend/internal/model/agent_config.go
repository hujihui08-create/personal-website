package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type AgentConfigJSON struct {
	LLM     AgentConfigLLM     `json:"llm"`
	Harness AgentConfigHarness `json:"harness"`
	Tools   AgentConfigTools   `json:"tools"`
}

type AgentConfigLLM struct {
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"maxTokens"`
	TopK        int     `json:"topK"`
}

type AgentConfigHarness struct {
	MaxSteps       int    `json:"maxSteps"`
	TimeoutSeconds int    `json:"timeoutSeconds"`
	LoopStrategy   string `json:"loopStrategy"`
}

type AgentConfigTools struct {
	Enabled []string `json:"enabled"`
}

func (c AgentConfigJSON) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *AgentConfigJSON) Scan(value interface{}) error {
	if value == nil {
		*c = AgentConfigJSON{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, c)
}

type AgentConfig struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	Status      string          `gorm:"size:20;default:draft" json:"status"`
	Version     string          `gorm:"size:20" json:"version"`
	Config      AgentConfigJSON `gorm:"column:config;type:jsonb;not null" json:"config"`
	CreatedAt   time.Time       `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"column:updated_at;default:now()" json:"updated_at"`
	PublishedAt *time.Time      `gorm:"column:published_at" json:"published_at"`
}

func (AgentConfig) TableName() string {
	return "agent_configs"
}
