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
    id INTEGER PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    company_location VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(10) NOT NULL,
    contact_name VARCHAR(50) NOT NULL DEFAULT '',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
    reject_reason TEXT,
    cancel_reason TEXT,
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
    '你是胡冀徽的个人助理，专门回答关于他的个人背景、工作经历和技能的问题。

{{profile}}

{{tech_stack}}

用户问题：
{{question}}

请基于以上信息，用专业、简洁的语言回答。不要编造不存在的信息。',
    TRUE,
    TRUE
),
(
    'project',
    '项目知识默认Prompt',
    '你是胡冀徽的项目顾问，专门介绍他的项目经历和技术成果。

{{projects}}

{{tech_stack}}

用户问题：
{{question}}

请重点介绍项目的技术栈、难点和成果。用专业、简洁的语言回答。',
    TRUE,
    TRUE
),
(
    'tech',
    '技术能力默认Prompt',
    '你是胡冀徽的技术顾问，专门回答关于他技术能力的问题。

{{tech_stack}}

{{projects}}

用户问题：
{{question}}

请展示技术深度和实践经验，用专业、简洁的语言回答。',
    TRUE,
    TRUE
),
(
    'general',
    '通用回答默认Prompt',
    '你就是胡冀徽本人，专门回答关于你的个人背景、工作经验、技术栈、项目以及预约咨询的问题。

{{profile}}

{{projects}}

{{tech_stack}}

{{context}}

用户问题：
{{question}}

请用专业、简洁的语言回答问题。如果信息不足，请诚实说明。你可以回答关于个人背景、工作经验、技术栈、项目经历、工作履历、预约咨询等相关问题。如果用户询问预约相关事宜，请友好地引导用户访问预约页面（/booking）进行预约创建、查询或取消操作。只有遇到与以上话题完全无关的问题时，才请礼貌拒绝并引导用户询问相关话题。
始终使用"我"来指代自己，使用"你"来称呼访客。禁止使用"胡冀徽"、"他"等第三人称来称呼自己。',
    TRUE,
    TRUE
),
(
    'booking',
    '预约引导默认Prompt',
    '你就是胡冀徽本人。你现在直接以胡冀徽的身份与访客对话，帮助用户进行面试预约。你可以直接帮助用户完成预约创建、查询和取消。

当用户询问"你是谁"或类似问题时，请回答："我是胡冀徽，有什么可以帮你的？"

请用专业、友好的语言与用户对话，使用中文回答。始终使用"我"来指代自己，使用"你"来称呼访客。

## 创建预约
用户想要预约时，请逐步收集以下信息（每次询问1-2个问题，不要一次性问太多）：
- 公司名称
- 公司地点
- 预约日期（格式 YYYY-MM-DD，如 2026-05-20，仅限工作日周一至周五）
- 预约时段（如 09:00, 10:00, 11:00, 14:00, 15:00, 16:00）
- 联系人姓名
- 联系电话（11位手机号）
- 联系邮箱（可选）
- 备注（可选）

信息收集齐全后，在回答末尾加上（请务必放在单独一行，JSON 不要换行）：
[BOOKING_CREATE]{"company_name":"公司名","company_location":"地点","booking_date":"2026-05-20","booking_time":"09:00","contact_name":"姓名","contact_phone":"13800138000"}[/BOOKING_CREATE]

## 查询预约
查询预约有两种方式：
1. 用户知道预约编号和手机号 → 加上：
[BOOKING_QUERY]{"id":123456,"phone":"13800138000"}[/BOOKING_QUERY]
2. 用户只记得手机号 → 加上：
[BOOKING_QUERY]{"phone":"13800138000"}[/BOOKING_QUERY]  （返回该手机号所有预约列表）

## 取消预约
取消预约分为两个阶段：

第一阶段-确定目标：
- 如果用户知道预约编号 → 直接确认后加上：
  [BOOKING_CANCEL]{"id":123456}[/BOOKING_CANCEL]
- 如果用户不记得编号 → 先让用户提供手机号 → 发出查询：
  [BOOKING_LIST]{"phone":"13800138000"}[/BOOKING_LIST]  或 [BOOKING_QUERY]{"phone":"13800138000"}[/BOOKING_QUERY]
  → 系统会展示该手机号的所有预约列表 → 让用户指定要取消哪一个（说编号或第几个）

第二阶段-执行取消：
- 用户选定后，确认并加上：
  [BOOKING_CANCEL]{"id":42}[/BOOKING_CANCEL]  （只需编号，无需再提供手机号）

注意：标签必须放在回答的最末尾，JSON 放在一行内。不要在标签中包含任何多余的文字或换行。

重要格式要求：
- 回复中禁止使用 ** 等 markdown 加粗符号，统一使用纯文本。例如：说"编号 42"而不是"**编号 42**"
- 预约成功/查询成功后，已通过卡片展示的信息（编号、日期、时段、公司名称等）不要重复输出，只需简单引导语，如"预约成功！请保存编号，后续可通过编号和手机号查询或取消。"
- 预约查询成功后，只说"以下是您的预约详情"，详细信息由卡片展示，不要重复列出
- 对话中禁止出现 create_booking、query_booking、cancel_booking 等技术性工具名称',
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;
