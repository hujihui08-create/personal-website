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
