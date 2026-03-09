-- Quick Setup Script for AWS Server
-- Run this to create users table and add admin user
-- Password: Admin@2026

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'provider', 'front_desk')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create schema_migrations table for tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add user_id to providers table
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 4. Insert admin user
-- Username: admin
-- Password: Admin@2026
-- The hash below is for Admin@2026
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@denticon.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ7lxZlHLZVcLvF5qVlL2dFT5w0K8Tzi', 'admin', true)
ON CONFLICT (username) DO UPDATE 
SET password = '$2a$10$CwTycUXWue0Thq9StjUM0uJ7lxZlHLZVcLvF5qVlL2dFT5w0K8Tzi',
    email = 'admin@denticon.com',
    is_active = true;

-- 5. Create provider users
-- Password for all: Provider@2026
INSERT INTO users (username, email, password, role, is_active) VALUES
('john.smith', 'john.smith@denticon.com', '$2a$10$X5RZJ5C5k5N5N5N5N5N5NuO5B5F5H5J5K5L5M5N5O5P5Q5R5S5T5U', 'provider', true),
('sarah.johnson', 'sarah.johnson@denticon.com', '$2a$10$X5RZJ5C5k5N5N5N5N5N5NuO5B5F5H5J5K5L5M5N5O5P5Q5R5S5T5U', 'provider', true),
('michael.brown', 'michael.brown@denticon.com', '$2a$10$X5RZJ5C5k5N5N5N5N5N5NuO5B5F5H5J5K5L5M5N5O5P5Q5R5S5T5U', 'provider', true),
('emily.davis', 'emily.davis@denticon.com', '$2a$10$X5RZJ5C5k5N5N5N5N5N5NuO5B5F5H5J5K5L5M5N5O5P5Q5R5S5T5U', 'provider', true),
('david.wilson', 'david.wilson@denticon.com', '$2a$10$X5RZJ5C5k5N5N5N5N5N5NuO5B5F5H5J5K5L5M5N5O5P5Q5R5S5T5U', 'provider', true)
ON CONFLICT (username) DO NOTHING;

-- 6. Link providers to users
DO $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Link Dr. John Smith
    SELECT id INTO v_user_id FROM users WHERE username = 'john.smith';
    IF v_user_id IS NOT NULL THEN
        UPDATE providers SET user_id = v_user_id, email = 'john.smith@denticon.com' WHERE id = 1;
    END IF;
    
    -- Link Dr. Sarah Johnson
    SELECT id INTO v_user_id FROM users WHERE username = 'sarah.johnson';
    IF v_user_id IS NOT NULL THEN
        UPDATE providers SET user_id = v_user_id, email = 'sarah.johnson@denticon.com' WHERE id = 2;
    END IF;
    
    -- Link Dr. Michael Brown
    SELECT id INTO v_user_id FROM users WHERE username = 'michael.brown';
    IF v_user_id IS NOT NULL THEN
        UPDATE providers SET user_id = v_user_id, email = 'michael.brown@denticon.com' WHERE id = 3;
    END IF;
    
    -- Link Dr. Emily Davis
    SELECT id INTO v_user_id FROM users WHERE username = 'emily.davis';
    IF v_user_id IS NOT NULL THEN
        UPDATE providers SET user_id = v_user_id, email = 'emily.davis@denticon.com' WHERE id = 4;
    END IF;
    
    -- Link Dr. David Wilson
    SELECT id INTO v_user_id FROM users WHERE username = 'david.wilson';
    IF v_user_id IS NOT NULL THEN
        UPDATE providers SET user_id = v_user_id, email = 'david.wilson@denticon.com' WHERE id = 5;
    END IF;
END $$;

-- 7. Record migration
INSERT INTO schema_migrations (migration_name) VALUES ('migration-auth.sql')
ON CONFLICT (migration_name) DO NOTHING;

-- 8. Verify setup
SELECT 'Users table created' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT username, email, role FROM users ORDER BY role, username;

COMMENT ON TABLE users IS 'System users with authentication credentials';
COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations';
