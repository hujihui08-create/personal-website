package repository

import (
	"fmt"
	"portfolio-backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type AgentConfigRepo struct {
	db *gorm.DB
}

func NewAgentConfigRepo(db *gorm.DB) *AgentConfigRepo {
	return &AgentConfigRepo{db: db}
}

func (r *AgentConfigRepo) GetCurrent() (*model.AgentConfig, error) {
	var config model.AgentConfig
	if err := r.db.Where("status = ?", "published").Order("published_at DESC").First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *AgentConfigRepo) GetDraft() (*model.AgentConfig, error) {
	var config model.AgentConfig
	if err := r.db.Where("status = ?", "draft").Order("updated_at DESC").First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *AgentConfigRepo) SaveDraft(configJSON model.AgentConfigJSON) (*model.AgentConfig, error) {
	draft, err := r.GetDraft()
	if err != nil {
		// No draft exists, create one
		draft = &model.AgentConfig{
			Status:  "draft",
			Version: "draft",
			Config:  configJSON,
		}
		if createErr := r.db.Create(draft).Error; createErr != nil {
			return nil, createErr
		}
		return draft, nil
	}

	draft.Config = configJSON
	if saveErr := r.db.Save(draft).Error; saveErr != nil {
		return nil, saveErr
	}
	return draft, nil
}

func (r *AgentConfigRepo) Publish(draftID uint) (*model.AgentConfig, error) {
	var draft model.AgentConfig
	if err := r.db.First(&draft, draftID).Error; err != nil {
		return nil, fmt.Errorf("draft not found: %w", err)
	}

	// Count published versions to generate version number
	var count int64
	r.db.Model(&model.AgentConfig{}).Where("status = ?", "published").Count(&count)
	version := fmt.Sprintf("v%d.%d", (count/10)+1, count%10+1)

	now := time.Now()
	published := &model.AgentConfig{
		Status:      "published",
		Version:     version,
		Config:      draft.Config,
		PublishedAt: &now,
	}
	if err := r.db.Create(published).Error; err != nil {
		return nil, err
	}

	return published, nil
}

func (r *AgentConfigRepo) ListVersions() ([]model.AgentConfig, error) {
	var versions []model.AgentConfig
	if err := r.db.Where("status = ?", "published").Order("published_at DESC").Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

func (r *AgentConfigRepo) Rollback(versionID uint) (*model.AgentConfig, error) {
	var version model.AgentConfig
	if err := r.db.First(&version, versionID).Error; err != nil {
		return nil, fmt.Errorf("version not found: %w", err)
	}
	if version.Status != "published" {
		return nil, fmt.Errorf("can only rollback to published versions")
	}

	// Create a new published version from the old one
	var count int64
	r.db.Model(&model.AgentConfig{}).Where("status = ?", "published").Count(&count)
	newVersion := fmt.Sprintf("v%d.%d", (count/10)+1, count%10+1)

	now := time.Now()
	rolled := &model.AgentConfig{
		Status:      "published",
		Version:     newVersion,
		Config:      version.Config,
		PublishedAt: &now,
	}
	if err := r.db.Create(rolled).Error; err != nil {
		return nil, err
	}

	return rolled, nil
}
