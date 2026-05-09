-- 初始化默认配置
-- 这个脚本会为系统设置默认的配置值

-- 首先检查 configs 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configs') THEN
        -- 创建 configs 表
        CREATE TABLE configs (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX idx_configs_key ON configs(key);
        CREATE INDEX idx_configs_category ON configs(category);
    END IF;
END $$;

-- 插入或更新默认的 LLM 配置
INSERT INTO configs (key, value, category, created_at, updated_at) VALUES
('llm.provider', 'openai', 'llm', NOW(), NOW()),
('llm.api_key', '', 'llm', NOW(), NOW()),
('llm.base_url', '', 'llm', NOW(), NOW()),
('llm.model', 'gpt-4o-mini', 'llm', NOW(), NOW()),
('llm.temperature', '0.7', 'llm', NOW(), NOW()),
('llm.max_tokens', '2000', 'llm', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 插入或更新默认的 Embedding 配置
INSERT INTO configs (key, value, category, created_at, updated_at) VALUES
('embedding.provider', 'openai', 'embedding', NOW(), NOW()),
('embedding.api_key', '', 'embedding', NOW(), NOW()),
('embedding.base_url', '', 'embedding', NOW(), NOW()),
('embedding.model', 'text-embedding-3-small', 'embedding', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 查看所有配置
SELECT * FROM configs ORDER BY category, key;
