package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type Embedding []float32

func (e Embedding) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *Embedding) Scan(value interface{}) error {
	if value == nil {
		*e = Embedding{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, e)
}

type KnowledgeDoc struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Filename  string    `gorm:"column:filename;size:255" json:"filename"`
	Content   string    `gorm:"column:content;type:text" json:"content"`
	Embedding Embedding `gorm:"column:embedding;type:vector(1536)" json:"embedding,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;default:now()" json:"updated_at"`
}

func (KnowledgeDoc) TableName() string {
	return "knowledge_docs"
}
