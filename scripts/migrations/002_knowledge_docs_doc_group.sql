-- ============================================================
-- Migration: 002_knowledge_docs_doc_group
-- Description: knowledge_docs 增加 document_group 列，支撑文档级分组和去重检索
-- Created: 2026-05-14
-- ============================================================

BEGIN;

ALTER TABLE knowledge_docs ADD COLUMN IF NOT EXISTS document_group VARCHAR(64) DEFAULT '';

ALTER TABLE knowledge_docs ALTER COLUMN document_group SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_doc_group
    ON knowledge_docs(document_group);

COMMIT;
