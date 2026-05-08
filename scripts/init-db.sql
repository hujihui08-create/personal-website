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
