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

func (r *ChatSessionRepository) FindByVisitorID(visitorID string) ([]model.ChatSession, error) {
	var sessions []model.ChatSession
	if err := r.db.Where("visitor_id = ?", visitorID).Order("updated_at DESC").Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *ChatSessionRepository) DeleteBySessionIDAndVisitor(sessionID, visitorID string) error {
	return r.db.Where("session_id = ? AND visitor_id = ?", sessionID, visitorID).Delete(&model.ChatSession{}).Error
}

func (r *ChatSessionRepository) UpdateTitle(sessionID, title string) error {
	return r.db.Model(&model.ChatSession{}).Where("session_id = ?", sessionID).Update("title", title).Error
}
