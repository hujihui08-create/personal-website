package database

import (
	"fmt"
	"time"

	"portfolio-backend/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect initializes the PostgreSQL connection and verifies connectivity.
func Connect(cfg config.DatabaseConfig) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open database connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get raw database handle: %w", err)
	}

	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(10)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return db, nil
}

// Close shuts down the underlying SQL connection pool.
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("get raw database handle for close: %w", err)
	}
	return sqlDB.Close()
}
