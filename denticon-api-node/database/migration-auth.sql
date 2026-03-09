-- ==========================================
-- AUTHENTICATION MIGRATION
-- Add user authentication and role-based access
-- ==========================================

-- 1. Create users table for all system users
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

-- 2. Add email and password to providers table (link to users)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Create admin user (password: Admin@2026 - bcrypt hashed)
-- Hash generated with: bcrypt.hash('Admin@2026', 10)
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@denticon.com', '$2a$10$FR4ZztwX5XKGobFGF2Yi6.rRxjVKKisW3K8MLNyehLbqSH9epFIW.', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 4. Create provider users and link them
-- Password for all providers: Provider@2026
DO $$
DECLARE
    user_id_1 INTEGER;
    user_id_2 INTEGER;
    user_id_3 INTEGER;
    user_id_4 INTEGER;
    user_id_5 INTEGER;
BEGIN
    -- Dr. John Smith
    INSERT INTO users (username, email, password, role, is_active) 
    VALUES ('john.smith', 'john.smith@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'provider', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO user_id_1;
    
    IF user_id_1 IS NOT NULL THEN
        UPDATE providers SET user_id = user_id_1, email = 'john.smith@denticon.com' WHERE id = 1;
    END IF;
    
    -- Dr. Sarah Johnson
    INSERT INTO users (username, email, password, role, is_active) 
    VALUES ('sarah.johnson', 'sarah.johnson@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'provider', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO user_id_2;
    
    IF user_id_2 IS NOT NULL THEN
        UPDATE providers SET user_id = user_id_2, email = 'sarah.johnson@denticon.com' WHERE id = 2;
    END IF;
    
    -- Dr. Michael Brown
    INSERT INTO users (username, email, password, role, is_active) 
    VALUES ('michael.brown', 'michael.brown@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'provider', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO user_id_3;
    
    IF user_id_3 IS NOT NULL THEN
        UPDATE providers SET user_id = user_id_3, email = 'michael.brown@denticon.com' WHERE id = 3;
    END IF;
    
    -- Dr. Emily Davis
    INSERT INTO users (username, email, password, role, is_active) 
    VALUES ('emily.davis', 'emily.davis@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'provider', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO user_id_4;
    
    IF user_id_4 IS NOT NULL THEN
        UPDATE providers SET user_id = user_id_4, email = 'emily.davis@denticon.com' WHERE id = 4;
    END IF;
    
    -- Dr. David Wilson
    INSERT INTO users (username, email, password, role, is_active) 
    VALUES ('david.wilson', 'david.wilson@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'provider', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO user_id_5;
    
    IF user_id_5 IS NOT NULL THEN
        UPDATE providers SET user_id = user_id_5, email = 'david.wilson@denticon.com' WHERE id = 5;
    END IF;
END $$;

-- 5. Create front desk users (password: FrontDesk@2026)
INSERT INTO users (username, email, password, role, is_active) VALUES
('receptionist', 'receptionist@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'front_desk', true),
('frontdesk', 'frontdesk@denticon.com', '$2a$10$PnPgX8jd6YGCGOlaESPjrOURbcmwaXOYe3/pfq9O3znWShm06fY6O', 'front_desk', true)
ON CONFLICT (username) DO NOTHING;

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 7. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- ==========================================
-- DEFAULT CREDENTIALS
-- ==========================================
-- Admin:
--   Username: admin
--   Password: admin123
--   Email: admin@denticon.com

-- Providers (all use password: provider123):
--   john.smith@denticon.com / john.smith
--   sarah.johnson@denticon.com / sarah.johnson
--   michael.brown@denticon.com / michael.brown
--   emily.davis@denticon.com / emily.davis
--   david.wilson@denticon.com / david.wilson

-- Front Desk (password: frontdesk123):
--   receptionist@denticon.com / receptionist
--   frontdesk@denticon.com / frontdesk
