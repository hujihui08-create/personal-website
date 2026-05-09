package repository

import (
	"portfolio-backend/internal/model"
	"gorm.io/gorm"
)

type ChatSessionRepository struct {
	db *gorm.DB
}

func NewChatSessionRepository(db *gorm.DB) *ChatSessionRepository {
	return &ChatSessionRepository{db: db}
}

func (r *ChatSessionRepository) Create(session *model.ChatSession) error {
	return r.db.Create(session).Error
}

func (r *ChatSessionRepository) FindBySessionID(sessionID string) (*model.ChatSession, error) {
	var session model.ChatSession
	if err := r.db.Where("session_id = ?", sessionID).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *ChatSessionRepository) Update(session *model.ChatSession) error {
	return r.db.Save(session).Error
}

func (r *ChatSessionRepository) DeleteBySessionID(sessionID string) error {
	return r.db.Where("session_id = ?", sessionID).Delete(&model.ChatSession{}).Error
}
