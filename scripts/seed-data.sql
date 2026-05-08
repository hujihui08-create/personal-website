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
