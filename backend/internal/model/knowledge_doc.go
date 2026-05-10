package model

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type KnowledgeDoc struct {
	ID        uint            `gorm:"primaryKey" json:"id"`
	Filename  string          `gorm:"column:filename;size:255" json:"filename"`
	Content   string          `gorm:"column:content;type:text" json:"content"`
	Embedding pgvector.Vector `gorm:"column:embedding;type:vector(1536)" json:"embedding,omitempty"`
	CreatedAt time.Time       `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt time.Time       `gorm:"column:updated_at;default:now()" json:"updated_at"`
}

func (KnowledgeDoc) TableName() string {
	return "knowledge_docs"
}
