BEGIN;

CREATE TABLE IF NOT EXISTS agent_intents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100),
    keywords TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    prompt_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO agent_intents (name, label, keywords, sort_order) VALUES
('resume', '简历/工作经验', '简历,resume,cv,工作经历,工作履历,项目经验,技能,work experience,skill,background,experience', 100),
('booking', '预约咨询', '预约,预订,booking,meeting,会议,时间,schedule,安排,约个时间,见面,取消,查询预约,我的预约', 90),
('project', '项目/作品', '项目,project,作品,portfolio,案例,case', 80),
('tech', '技术栈', '技术栈,技术,tech stack,编程语言,框架,后端,前端,数据库,云计算,devops,开发,架构,微服务,容器,kubernetes,docker', 70),
('general', '通用', '', 0)
ON CONFLICT (name) DO NOTHING;

COMMIT;
