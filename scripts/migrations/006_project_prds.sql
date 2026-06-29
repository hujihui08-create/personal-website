-- Migration: Create project_prds table for PRD management
-- Date: 2026-06-29

CREATE TABLE IF NOT EXISTS project_prds (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    prd_url VARCHAR(1000) NOT NULL DEFAULT '',
    prototype_id INT REFERENCES prototypes(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_prds_project_id ON project_prds(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prds_sort_order ON project_prds(project_id, sort_order);
