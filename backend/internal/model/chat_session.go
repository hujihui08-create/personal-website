package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type ChatMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CardData  string    `json:"card_data,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

type ChatMessages []ChatMessage

func (c ChatMessages) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *ChatMessages) Scan(value interface{}) error {
	if value == nil {
		*c = ChatMessages{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, c)
}

type ChatSession struct {
	ID        uint         `gorm:"primaryKey" json:"id"`
	SessionID string       `gorm:"column:session_id;unique;not null;size:100" json:"session_id"`
	VisitorID string       `gorm:"column:visitor_id;size:100;index" json:"visitor_id"`
	Title     string       `gorm:"column:title;size:200;default:''" json:"title"`
	Messages  ChatMessages `gorm:"column:messages;type:jsonb;default:'[]'" json:"messages"`
	CreatedAt time.Time    `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt time.Time    `gorm:"column:updated_at;default:now()" json:"updated_at"`
}

func (ChatSession) TableName() string {
	return "chat_sessions"
}
