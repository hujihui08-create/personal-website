-- ============================================================
-- Migration: 001_agent_debug
-- Description: Agent调试功能数据库变更
-- Created: 2026-05-14
-- PRD: portfolio-docs/10-Agent调试功能迭代.md
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- 3.1 新增表
-- -----------------------------------------------------------

-- Agent调试记录表
CREATE TABLE IF NOT EXISTS agent_debug_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    agent_type VARCHAR(50),
    intent_classification JSONB,
    retrieval_info JSONB,
    generation_stats JSONB,
    custom_prompt_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Prompt模板表
CREATE TABLE IF NOT EXISTS agent_prompts (
    id SERIAL PRIMARY KEY,
    agent_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    context_template TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 3.2 新增索引
-- -----------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_admin
    ON agent_debug_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_created_at
    ON agent_debug_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_type
    ON agent_prompts(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_default
    ON agent_prompts(agent_type, is_default) WHERE is_default = TRUE;

-- 部分唯一索引：每个 agent_type 只能有一个默认 Prompt
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_prompts_default_unique
    ON agent_prompts(agent_type) WHERE is_default = TRUE;

-- -----------------------------------------------------------
-- 3.3 默认Prompt数据
-- -----------------------------------------------------------

INSERT INTO agent_prompts (agent_type, name, system_prompt, is_default, is_active) VALUES
(
    'profile',
    '个人资料默认Prompt',
    '你是一个专业的个人助理，基于以下个人资料信息回答问题。请简洁、准确地回答，不要编造信息。

个人资料：
{{profile}}

用户问题：{{question}}',
    TRUE,
    TRUE
),
(
    'project',
    '项目知识默认Prompt',
    '你是一个项目专家，基于以下项目信息回答用户问题。请重点介绍项目的技术栈、难点和成果。

项目信息：
{{projects}}

用户问题：{{question}}',
    TRUE,
    TRUE
),
(
    'tech',
    '技术能力默认Prompt',
    '你是一个技术专家，基于以下技术栈信息回答用户问题。请展示技术深度和实践经验。

技术栈信息：
{{tech_stack}}

用户问题：{{question}}',
    TRUE,
    TRUE
),
(
    'general',
    '通用回答默认Prompt',
    '你是一个友好的个人助理，基于以下信息回答用户问题。如果信息不足，请礼貌地说明。

相关信息：
{{context}}

用户问题：{{question}}',
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;

COMMIT;
