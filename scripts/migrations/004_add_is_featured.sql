-- Migration: Add is_featured column to projects table
-- Date: 2026-06-17

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Set existing projects with highest sort orders as featured (optional)
-- UPDATE projects SET is_featured = TRUE WHERE sort_order >= (SELECT sort_order FROM projects ORDER BY sort_order DESC LIMIT 1 OFFSET 3);
