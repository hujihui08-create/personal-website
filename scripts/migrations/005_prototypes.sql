-- Migration: Create prototypes table for HTML prototype preview
-- Date: 2026-06-29

CREATE TABLE IF NOT EXISTS prototypes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    file_count INT NOT NULL DEFAULT 0,
    storage_prefix VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prototypes_created_at ON prototypes(created_at DESC);
