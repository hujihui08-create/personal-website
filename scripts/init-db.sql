CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "vector";
COMMENT ON EXTENSION vector IS 'Vector storage for AI embeddings';

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    notification_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 作品表（供 work_experiences 外键引用）
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    cover_image_url VARCHAR(500) NOT NULL DEFAULT '',
    live_url VARCHAR(500) NOT NULL DEFAULT '',
    source_url VARCHAR(500) NOT NULL DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 个人资料表
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT '',
    title VARCHAR(100) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar_url VARCHAR(500) NOT NULL DEFAULT '',
    github_url VARCHAR(500) NOT NULL DEFAULT '',
    linkedin_url VARCHAR(500) NOT NULL DEFAULT '',
    email VARCHAR(100) NOT NULL DEFAULT '',
    skills TEXT[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 工作经历表
CREATE TABLE IF NOT EXISTS work_experiences (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT NOT NULL DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 工作经历与项目关联表
CREATE TABLE IF NOT EXISTS experience_projects (
    id SERIAL PRIMARY KEY,
    experience_id INT NOT NULL REFERENCES work_experiences(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    UNIQUE(experience_id, project_id)
);

-- 简历表
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    file_url VARCHAR(500) NOT NULL DEFAULT '',
    file_name VARCHAR(200) NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 预约时段设置表
CREATE TABLE IF NOT EXISTS schedule_settings (
    id SERIAL PRIMARY KEY,
    weekday INT NOT NULL CHECK (weekday BETWEEN 1 AND 5),
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(weekday, start_time)
);

-- 预约表
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    company_location VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(10) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
    reject_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(booking_date, booking_time)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 通知索引
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Agent会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 会话索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- ============================================
-- Agent Debug & Prompt Management Tables
-- ============================================

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

-- Agent Debug索引
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

-- 默认Prompt数据
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
