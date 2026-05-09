package service

import (
	"encoding/json"
	"log"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type ConfigService struct {
	configRepo *repository.ConfigRepository
}

func NewConfigService(configRepo *repository.ConfigRepository) *ConfigService {
	return &ConfigService{
		configRepo: configRepo,
	}
}

const (
	CategoryLLM       = "llm"
	CategoryEmbedding = "embedding"
	CategoryGeneral   = "general"
)

const (
	KeyLLMProvider     = "llm.provider"
	KeyLLMApiKey      = "llm.api_key"
	KeyLLMBaseURL     = "llm.base_url"
	KeyLLMModel       = "llm.model"
	KeyLLMTemperature = "llm.temperature"
	KeyLLMMaxTokens   = "llm.max_tokens"

	KeyEmbeddingProvider = "embedding.provider"
	KeyEmbeddingApiKey   = "embedding.api_key"
	KeyEmbeddingBaseURL  = "embedding.base_url"
	KeyEmbeddingModel    = "embedding.model"
)

func (s *ConfigService) GetAllConfigs() ([]model.ConfigResponse, error) {
	configs, err := s.configRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var responses []model.ConfigResponse
	for _, cfg := range configs {
		responses = append(responses, model.ConfigResponse{
			ID:        cfg.ID,
			Key:       cfg.Key,
			Value:     cfg.Value,
			Category:  cfg.Category,
			CreatedAt: cfg.CreatedAt,
			UpdatedAt: cfg.UpdatedAt,
		})
	}
	return responses, nil
}

func (s *ConfigService) GetConfigsByCategory(category string) ([]model.ConfigResponse, error) {
	configs, err := s.configRepo.FindByCategory(category)
	if err != nil {
		return nil, err
	}

	var responses []model.ConfigResponse
	for _, cfg := range configs {
		responses = append(responses, model.ConfigResponse{
			ID:        cfg.ID,
			Key:       cfg.Key,
			Value:     cfg.Value,
			Category:  cfg.Category,
			CreatedAt: cfg.CreatedAt,
			UpdatedAt: cfg.UpdatedAt,
		})
	}
	return responses, nil
}

func (s *ConfigService) GetLLMConfig() (*model.LLMConfig, error) {
	configs, err := s.configRepo.FindByCategory(CategoryLLM)
	if err != nil {
		return nil, err
	}

	cfgMap := make(map[string]string)
	for _, cfg := range configs {
		cfgMap[cfg.Key] = cfg.Value
	}

	result := &model.LLMConfig{
		Provider:    cfgMap[KeyLLMProvider],
		APIKey:      cfgMap[KeyLLMApiKey],
		BaseURL:     cfgMap[KeyLLMBaseURL],
		Model:       cfgMap[KeyLLMModel],
		Temperature: 0.7,
		MaxTokens:   2000,
	}

	if temp, ok := cfgMap[KeyLLMTemperature]; ok {
		var t float64
		if err := json.Unmarshal([]byte(temp), &t); err == nil {
			result.Temperature = t
		}
	}

	if maxTokens, ok := cfgMap[KeyLLMMaxTokens]; ok {
		var t int
		if err := json.Unmarshal([]byte(maxTokens), &t); err == nil {
			result.MaxTokens = t
		}
	}

	return result, nil
}

func (s *ConfigService) GetEmbeddingConfig() (*model.EmbeddingConfig, error) {
	configs, err := s.configRepo.FindByCategory(CategoryEmbedding)
	if err != nil {
		return nil, err
	}

	cfgMap := make(map[string]string)
	for _, cfg := range configs {
		cfgMap[cfg.Key] = cfg.Value
	}

	return &model.EmbeddingConfig{
		Provider: cfgMap[KeyEmbeddingProvider],
		APIKey:   cfgMap[KeyEmbeddingApiKey],
		BaseURL:  cfgMap[KeyEmbeddingBaseURL],
		Model:    cfgMap[KeyEmbeddingModel],
	}, nil
}

func (s *ConfigService) UpdateConfig(key string, value string) error {
	return s.configRepo.Update(key, value)
}

func (s *ConfigService) UpdateLLMConfig(cfg *model.LLMConfig) error {
	log.Println("[ConfigService.UpdateLLMConfig] 开始更新 LLM 配置")
	
	keys := []struct {
		key   string
		value string
	}{
		{KeyLLMProvider, cfg.Provider},
		{KeyLLMApiKey, cfg.APIKey},
		{KeyLLMBaseURL, cfg.BaseURL},
		{KeyLLMModel, cfg.Model},
	}
	
	for _, k := range keys {
		log.Printf("[ConfigService.UpdateLLMConfig] 正在更新: %s = %s", k.key, k.value)
		if err := s.configRepo.Upsert(k.key, k.value, CategoryLLM); err != nil {
			log.Printf("[ConfigService.UpdateLLMConfig] 更新失败: %s, 错误: %v", k.key, err)
			return err
		}
	}
	
	tempBytes, _ := json.Marshal(cfg.Temperature)
	log.Printf("[ConfigService.UpdateLLMConfig] 正在更新: %s = %s", KeyLLMTemperature, string(tempBytes))
	if err := s.configRepo.Upsert(KeyLLMTemperature, string(tempBytes), CategoryLLM); err != nil {
		log.Printf("[ConfigService.UpdateLLMConfig] 更新失败: %s, 错误: %v", KeyLLMTemperature, err)
		return err
	}
	
	maxTokensBytes, _ := json.Marshal(cfg.MaxTokens)
	log.Printf("[ConfigService.UpdateLLMConfig] 正在更新: %s = %s", KeyLLMMaxTokens, string(maxTokensBytes))
	if err := s.configRepo.Upsert(KeyLLMMaxTokens, string(maxTokensBytes), CategoryLLM); err != nil {
		log.Printf("[ConfigService.UpdateLLMConfig] 更新失败: %s, 错误: %v", KeyLLMMaxTokens, err)
		return err
	}
	
	log.Println("[ConfigService.UpdateLLMConfig] LLM 配置更新完成")
	return nil
}

func (s *ConfigService) UpdateEmbeddingConfig(cfg *model.EmbeddingConfig) error {
	log.Println("[ConfigService.UpdateEmbeddingConfig] 开始更新 Embedding 配置")
	
	keys := []struct {
		key   string
		value string
	}{
		{KeyEmbeddingProvider, cfg.Provider},
		{KeyEmbeddingApiKey, cfg.APIKey},
		{KeyEmbeddingBaseURL, cfg.BaseURL},
		{KeyEmbeddingModel, cfg.Model},
	}
	
	for _, k := range keys {
		log.Printf("[ConfigService.UpdateEmbeddingConfig] 正在更新: %s = %s", k.key, k.value)
		if err := s.configRepo.Upsert(k.key, k.value, CategoryEmbedding); err != nil {
			log.Printf("[ConfigService.UpdateEmbeddingConfig] 更新失败: %s, 错误: %v", k.key, err)
			return err
		}
	}
	
	log.Println("[ConfigService.UpdateEmbeddingConfig] Embedding 配置更新完成")
	return nil
}
