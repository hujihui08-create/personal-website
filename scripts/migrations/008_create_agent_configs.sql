BEGIN;

CREATE TABLE IF NOT EXISTS agent_configs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'draft',
    version VARCHAR(20),
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_status ON agent_configs(status);
CREATE INDEX IF NOT EXISTS idx_agent_configs_published_at ON agent_configs(published_at DESC);

COMMIT;
