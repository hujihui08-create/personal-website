-- Seed data template for portfolio_dev database
-- This file is optional and can be used to populate initial test data

-- Example: Insert sample user (uncomment and modify as needed)
-- INSERT INTO users (id, email, name, created_at)
-- VALUES (
--   uuid_generate_v4(),
--   'admin@example.com',
--   'Admin User',
--   NOW()
-- );

-- Example: Insert sample work experience
-- INSERT INTO work_experiences (id, company, position, start_date, end_date, description)
-- VALUES (
--   uuid_generate_v4(),
--   'Example Company',
--   'Software Engineer',
--   '2020-01-01',
--   NULL,
--   'Developing web applications...'
-- );

-- Example: Insert sample project
-- INSERT INTO projects (id, title, description, cover_image_url, live_url, source_url)
-- VALUES (
--   uuid_generate_v4(),
--   'Sample Project',
--   'A sample project description',
--   'https://example.com/cover.jpg',
--   'https://example.com',
--   'https://github.com/example/project'
-- );

-- Insert initial admin (password: admin123)
-- bcrypt hash for "admin123" with cost factor 12
INSERT INTO admins (password_hash) VALUES ('$2a$12$apIi9wfTd4HYAnZJHl7Zve9XrvGKvu0JBl09wuIPuP86qdLc4Ji5W');

-- Add your seed data below:

-- Insert sample profile
INSERT INTO profiles (name, title, bio, avatar_url, github_url, linkedin_url, email, skills)
VALUES (
    'Demo User',
    'Full-Stack Developer',
    'A passionate developer with experience in building modern web applications.',
    '',
    'https://github.com/demouser',
    'https://linkedin.com/in/demouser',
    'demo@example.com',
    ARRAY['Go', 'TypeScript', 'React', 'PostgreSQL', 'Docker']
);

-- Insert sample work experiences
INSERT INTO work_experiences (company_name, position, start_date, end_date, description, sort_order)
VALUES
    ('Tech Corp', 'Senior Software Engineer', '2022-01-01', NULL, 'Leading development of microservices architecture using Go and PostgreSQL. Managing a team of 5 engineers.', 0),
    ('Startup Inc', 'Full-Stack Developer', '2020-03-01', '2021-12-31', 'Built and maintained multiple client-facing web applications using React and Node.js.', 1),
    ('Freelance', 'Junior Developer', '2018-06-01', '2020-02-28', 'Developed custom WordPress themes and plugins for small businesses.', 2);

-- Insert default schedule settings
INSERT INTO schedule_settings (weekday, start_time, end_time, is_active)
VALUES
    -- Monday (1)
    (1, '09:00', '10:00', TRUE),
    (1, '10:00', '11:00', TRUE),
    (1, '11:00', '12:00', TRUE),
    (1, '14:00', '15:00', TRUE),
    (1, '15:00', '16:00', TRUE),
    -- Tuesday (2)
    (2, '09:00', '10:00', TRUE),
    (2, '10:00', '11:00', TRUE),
    (2, '14:00', '15:00', TRUE),
    (2, '15:00', '16:00', TRUE),
    (2, '16:00', '17:00', TRUE),
    -- Wednesday (3)
    (3, '09:00', '10:00', TRUE),
    (3, '10:00', '11:00', TRUE),
    (3, '11:00', '12:00', TRUE),
    (3, '14:00', '15:00', TRUE),
    (3, '15:00', '16:00', TRUE),
    -- Thursday (4)
    (4, '09:00', '10:00', TRUE),
    (4, '10:00', '11:00', TRUE),
    (4, '14:00', '15:00', TRUE),
    (4, '15:00', '16:00', TRUE),
    -- Friday (5)
    (5, '09:00', '10:00', TRUE),
    (5, '10:00', '11:00', TRUE),
    (5, '14:00', '15:00', TRUE),
    (5, '15:00', '16:00', TRUE),
    (5, '16:00', '17:00', TRUE);
