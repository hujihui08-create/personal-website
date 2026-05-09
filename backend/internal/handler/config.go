package handler

import (
	"log"
	"net/http"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ConfigHandler struct {
	configService *service.ConfigService
}

func NewConfigHandler(configService *service.ConfigService) *ConfigHandler {
	return &ConfigHandler{
		configService: configService,
	}
}

type UpdateLLMConfigRequest struct {
	Provider    string  `json:"provider"`
	APIKey      string  `json:"api_key"`
	BaseURL     string  `json:"base_url"`
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int    `json:"max_tokens"`
}

type UpdateEmbeddingConfigRequest struct {
	Provider string `json:"provider"`
	APIKey   string `json:"api_key"`
	BaseURL  string `json:"base_url"`
	Model    string `json:"model"`
}

func (h *ConfigHandler) GetAllConfigs(c *gin.Context) {
	configs, err := h.configService.GetAllConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取配置失败",
			"data":    nil,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    configs,
	})
}

func (h *ConfigHandler) GetLLMConfig(c *gin.Context) {
	config, err := h.configService.GetLLMConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取LLM配置失败",
			"data":    nil,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    config,
	})
}

func (h *ConfigHandler) UpdateLLMConfig(c *gin.Context) {
	log.Println("[UpdateLLMConfig] 开始处理请求")
	var req UpdateLLMConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[UpdateLLMConfig] 请求格式错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
			"data":    nil,
		})
		return
	}

	log.Printf("[UpdateLLMConfig] 接收到的配置: Provider=%s, Model=%s, Temperature=%f, MaxTokens=%d", 
		req.Provider, req.Model, req.Temperature, req.MaxTokens)

	cfg := &model.LLMConfig{
		Provider:    req.Provider,
		APIKey:      req.APIKey,
		BaseURL:     req.BaseURL,
		Model:       req.Model,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
	}

	if err := h.configService.UpdateLLMConfig(cfg); err != nil {
		log.Printf("[UpdateLLMConfig] 更新失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新LLM配置失败",
			"data":    nil,
		})
		return
	}

	log.Println("[UpdateLLMConfig] 更新成功")
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "LLM配置更新成功",
		"data":    nil,
	})
}

func (h *ConfigHandler) GetEmbeddingConfig(c *gin.Context) {
	config, err := h.configService.GetEmbeddingConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取Embedding配置失败",
			"data":    nil,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    config,
	})
}

func (h *ConfigHandler) UpdateEmbeddingConfig(c *gin.Context) {
	log.Println("[UpdateEmbeddingConfig] 开始处理请求")
	var req UpdateEmbeddingConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[UpdateEmbeddingConfig] 请求格式错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求格式错误",
			"data":    nil,
		})
		return
	}

	log.Printf("[UpdateEmbeddingConfig] 接收到的配置: Provider=%s, Model=%s", 
		req.Provider, req.Model)

	cfg := &model.EmbeddingConfig{
		Provider: req.Provider,
		APIKey:   req.APIKey,
		BaseURL:  req.BaseURL,
		Model:    req.Model,
	}

	if err := h.configService.UpdateEmbeddingConfig(cfg); err != nil {
		log.Printf("[UpdateEmbeddingConfig] 更新失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新Embedding配置失败",
			"data":    nil,
		})
		return
	}

	log.Println("[UpdateEmbeddingConfig] 更新成功")
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Embedding配置更新成功",
		"data":    nil,
	})
}
