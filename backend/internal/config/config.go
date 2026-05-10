package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	MinIO    MinIOConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Email    EmailConfig
	LLM      EnvLLMConfig
}

type ServerConfig struct {
	Address string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type MinIOConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	UseSSL          bool
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

type CORSConfig struct {
	AllowedOrigins string
}

type EmailConfig struct {
	Provider     string // "brevo", "smtp", "sendgrid"
	APIKey       string
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
	AdminEmail   string
}

type EnvLLMConfig struct {
	Provider          string // "openai", "anthropic", "dashscope"
	APIKey            string
	BaseURL           string
	ChatModel         string
	EmbeddingModel    string
	MaxTokens         int
	Temperature       float64
	DailyLimitPerUser int
}

func Load() *Config {
	// 尝试从多个位置加载 .env 文件
	envFiles := []string{
		".env",
		"../.env",
		"../../.env",
	}

	for _, file := range envFiles {
		if err := godotenv.Load(file); err == nil {
			log.Printf("Loaded environment variables from %s", file)
			break
		}
	}

	return &Config{
		Server: ServerConfig{
			Address: getEnv("SERVER_ADDRESS", ":8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "devpassword"),
			DBName:   getEnv("DB_NAME", "portfolio_dev"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		MinIO: MinIOConfig{
			Endpoint:        getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKeyID:     getEnv("MINIO_ACCESS_KEY", "minioadmin"),
			SecretAccessKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
			Bucket:          getEnv("MINIO_BUCKET", "portfolio"),
			UseSSL:          getEnvBool("MINIO_USE_SSL", false),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "dev-jwt-secret-key"),
			Expiration: getEnvDuration("JWT_EXPIRATION", 168*time.Hour),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "*"),
		},
		Email: EmailConfig{
			Provider:     getEnv("EMAIL_PROVIDER", "brevo"),
			APIKey:       getEnv("EMAIL_API_KEY", ""),
			SMTPHost:     getEnv("EMAIL_SMTP_HOST", "smtp-relay.brevo.com"),
			SMTPPort:     getEnvInt("EMAIL_SMTP_PORT", 587),
			SMTPUser:     getEnv("EMAIL_SMTP_USER", ""),
			SMTPPassword: getEnv("EMAIL_SMTP_PASSWORD", ""),
			FromEmail:    getEnv("EMAIL_FROM", "noreply@example.com"),
			FromName:     getEnv("EMAIL_FROM_NAME", "个人网站"),
			AdminEmail:   getEnv("EMAIL_ADMIN", ""),
		},
		LLM: EnvLLMConfig{
			Provider:          getEnv("LLM_PROVIDER", "openai"),
			APIKey:            getEnv("LLM_API_KEY", ""),
			BaseURL:           getEnv("LLM_BASE_URL", ""),
			ChatModel:         getEnv("LLM_CHAT_MODEL", "gpt-4o-mini"),
			EmbeddingModel:    getEnv("LLM_EMBEDDING_MODEL", "text-embedding-3-small"),
			MaxTokens:         getEnvInt("LLM_MAX_TOKENS", 2048),
			Temperature:       getEnvFloat("LLM_TEMPERATURE", 0.7),
			DailyLimitPerUser: getEnvInt("LLM_DAILY_LIMIT", 50),
		},
	}
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return defaultValue
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

func (r *RedisConfig) Address() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
