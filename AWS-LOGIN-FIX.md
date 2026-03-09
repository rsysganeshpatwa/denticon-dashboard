# Quick Fix for AWS Server Login Issue

## Problem
Getting 401 Unauthorized when trying to login because the `users` table doesn't exist yet.

## Solution - Run Migration on AWS Server

### Option 1: Use Docker Exec (Recommended)
```bash
# SSH into your AWS server first
ssh -i your-key.pem ubuntu@ec2-43-205-127-45.ap-south-1.compute.amazonaws.com

# Copy the quickstart SQL file to the container
sudo docker cp /path/to/quickstart-aws.sql denticon-postgres:/tmp/

# Run the SQL file
sudo docker exec -it denticon-postgres psql -U postgres -d denticon -f /tmp/quickstart-aws.sql

# Or directly pipe it
cat /path/to/denticon-api-node/database/quickstart-aws.sql | sudo docker exec -i denticon-postgres psql -U postgres -d denticon
```

### Option 2: Use Docker Compose (Rebuild)
```bash
# SSH into AWS server
ssh -i your-key.pem ubuntu@ec2-43-205-127-45.ap-south-1.compute.amazonaws.com

# Go to project directory
cd /path/to/project

# Rebuild and restart API (this will run migrations automatically)
sudo docker-compose build denticon-api
sudo docker-compose up -d denticon-api

# Check logs
sudo docker-compose logs denticon-api | grep -i migration
```

### Option 3: Manual SQL Execution
```bash
# SSH into AWS server
ssh -i your-key.pem ubuntu@ec2-43-205-127-45.ap-south-1.compute.amazonaws.com

# Connect to database
sudo docker exec -it denticon-postgres psql -U postgres -d denticon

# Then paste these commands:
```sql
-- Create users table
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

-- Add columns to providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create admin user (Username: admin, Password: Admin@2026)
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@denticon.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ7lxZlHLZVcLvF5qVlL2dFT5w0K8Tzi', 'admin', true)
ON CONFLICT (username) DO UPDATE 
SET password = '$2a$10$CwTycUXWue0Thq9StjUM0uJ7lxZlHLZVcLvF5qVlL2dFT5w0K8Tzi';

-- Verify
SELECT username, email, role FROM users;
```

## Test Login After Setup

Try logging in with:
- **Username**: `admin`
- **Password**: `Admin@2026`

Or test with curl:
```bash
curl -X POST http://ec2-43-205-127-45.ap-south-1.compute.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2026"}'
```

Expected Response:
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@denticon.com",
      "role": "admin",
      "provider": null
    }
  }
}
```

## Future Deployments

To avoid this issue in the future, the migration system will run automatically when you:

1. Push code changes to git
2. Pull on AWS server
3. Run `docker-compose build && docker-compose up -d`

The entrypoint script will automatically detect and run any new migrations.

## Credentials Reference

### Admin Account
- Username: `admin`
- Password: `Admin@2026`
- Email: `admin@denticon.com`

### Provider Accounts
- Username: `john.smith`, `sarah.johnson`, `michael.brown`, etc.
- Password: `Provider@2026`
- Emails: `{username}@denticon.com`
