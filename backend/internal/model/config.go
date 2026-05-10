package model

import "time"

type Config struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Key       string    `gorm:"column:key;unique;not null" json:"key"`
	Value     string    `gorm:"column:value;type:text" json:"value"`
	Category  string    `gorm:"column:category;index" json:"category"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Config) TableName() string {
	return "configs"
}

type ConfigResponse struct {
	ID        uint      `json:"id"`
	Key       string    `json:"key"`
	Value     string    `json:"value,omitempty"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LLMConfig struct {
	Provider     string `json:"provider"`
	APIKey       string `json:"api_key"`
	BaseURL      string `json:"base_url"`
	Model        string `json:"model"`
	Temperature  float64 `json:"temperature"`
	MaxTokens    int    `json:"max_tokens"`
}

type EmbeddingConfig struct {
	Provider string `json:"provider"`
	APIKey   string `json:"api_key"`
	BaseURL  string `json:"base_url"`
	Model    string `json:"model"`
}
