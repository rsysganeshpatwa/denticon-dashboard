# Database Migration System

## Overview
This project uses an automated migration system that tracks and applies database schema changes automatically.

## How It Works

### 1. Migration Files
- All migration files are stored in `/denticon-api-node/database/`
- Migration files follow the naming pattern: `migration-*.sql`
- Examples: `migration-auth.sql`, `migration-followup.sql`

### 2. Automatic Migration on Docker Startup
When you run `docker-compose up`, migrations are **automatically applied**:

1. The database container starts and runs `init.sql` (if first time)
2. The API container starts and runs the entrypoint script
3. The entrypoint script calls `run-migrations.sh`
4. The migration runner:
   - Creates a `schema_migrations` table to track applied migrations
   - Checks which migrations have been applied
   - Applies only new migrations
   - Records each migration in the tracking table

### 3. Migration Tracking
The system uses a `schema_migrations` table to track which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Starting Fresh on a New Machine

```bash
# Clone the repository
git clone <your-repo>
cd practise

# Start all services (migrations run automatically)
docker-compose up -d

# Check migration logs
docker-compose logs denticon-api | grep -i migration
```

### Adding a New Migration

1. Create a new migration file:
```bash
cd denticon-api-node/database
nano migration-your-feature.sql
```

2. Write your SQL changes:
```sql
-- Migration: Your Feature Description
-- Date: 2026-03-09

ALTER TABLE appointments ADD COLUMN your_field VARCHAR(100);

-- Add indexes if needed
CREATE INDEX idx_your_field ON appointments(your_field);

-- Document the change
COMMENT ON COLUMN appointments.your_field IS 'Description of your field';
```

3. Restart the API container (migration runs automatically):
```bash
docker-compose restart denticon-api
```

### Manual Migration Run

If you need to run migrations manually:

```bash
# Option 1: Inside the container
docker exec -it denticon-api /app/database/run-migrations.sh

# Option 2: From host machine (if DB is exposed on port 5432)
cd denticon-api-node/database
DB_HOST=localhost DB_PORT=5432 ./run-migrations.sh
```

### Check Migration Status

```bash
# View all applied migrations
docker exec -it denticon-postgres psql -U postgres -d denticon -c "SELECT * FROM schema_migrations ORDER BY applied_at;"

# Count applied migrations
docker exec -it denticon-postgres psql -U postgres -d denticon -c "SELECT COUNT(*) FROM schema_migrations;"
```

### Rollback (Manual Process)

The system doesn't support automatic rollback. If you need to rollback:

1. Create a new migration file with the reverse changes
2. Or manually apply SQL commands:

```bash
docker exec -it denticon-postgres psql -U postgres -d denticon

-- Your rollback SQL here
ALTER TABLE appointments DROP COLUMN your_field;

-- Remove from migration tracking
DELETE FROM schema_migrations WHERE migration_name = 'migration-your-feature.sql';
```

## Migration Best Practices

### 1. Use Idempotent SQL
Always use `IF EXISTS` or `IF NOT EXISTS`:

```sql
-- Good ✓
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS new_field VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_new_field ON appointments(new_field);

-- Bad ✗
ALTER TABLE appointments ADD COLUMN new_field VARCHAR(100);
CREATE INDEX idx_new_field ON appointments(new_field);
```

### 2. Name Migrations Descriptively
- ✓ `migration-followup.sql`
- ✓ `migration-auth-roles.sql`
- ✓ `migration-patient-insurance.sql`
- ✗ `migration-1.sql`
- ✗ `migration-update.sql`

### 3. Include Comments
```sql
-- Migration: Add Follow-up Tracking
-- Date: 2026-03-09
-- Author: Developer Name
-- Description: Adds follow_up_required, next_visit_date, and follow_up_notes to appointments

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;
-- ... more changes
```

### 4. Test Migrations Locally First
```bash
# Test in a separate database first
docker exec -it denticon-postgres psql -U postgres -c "CREATE DATABASE test_db;"
docker exec -it denticon-postgres psql -U postgres -d test_db -f /path/to/migration.sql
```

### 5. Backup Before Major Changes
```bash
# Backup the database
docker exec denticon-postgres pg_dump -U postgres denticon > backup-$(date +%Y%m%d).sql

# Restore if needed
docker exec -i denticon-postgres psql -U postgres denticon < backup-20260309.sql
```

## Existing Migrations

### migration-auth.sql
- Adds authentication and authorization system
- Creates users table with roles (admin, provider, front_desk)
- Sets up password hashing and JWT support

### migration-followup.sql
- Adds follow-up tracking to appointments
- Adds fields: `follow_up_required`, `next_visit_date`, `follow_up_notes`
- Creates indexes for performance

## Troubleshooting

### Migration Not Running
```bash
# Check container logs
docker-compose logs denticon-api

# Verify migration file exists
docker exec denticon-api ls -la /app/database/

# Run migrations manually
docker exec -it denticon-api /app/database/run-migrations.sh
```

### Migration Failed Halfway
```bash
# Check which migrations were applied
docker exec -it denticon-postgres psql -U postgres -d denticon -c "SELECT * FROM schema_migrations;"

# Remove failed migration from tracking
docker exec -it denticon-postgres psql -U postgres -d denticon -c "DELETE FROM schema_migrations WHERE migration_name = 'failed-migration.sql';"

# Fix the migration file and restart
docker-compose restart denticon-api
```

### Database Connection Issues
```bash
# Check database is ready
docker exec denticon-postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres

# Verify connection settings in docker-compose.yml
```

## Environment Variables

The migration runner supports these environment variables:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: denticon)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: denticon_password_2024)

Example:
```bash
DB_HOST=myserver.com DB_USER=myuser ./run-migrations.sh
```

## Summary

✅ **Automatic**: Migrations run automatically on container startup
✅ **Tracked**: Each migration is recorded to prevent duplicate runs
✅ **Idempotent**: Safe to run multiple times
✅ **Portable**: Works the same on any machine
✅ **Logged**: Full output shows what was applied

**No manual intervention needed when deploying to a new machine!** Just run `docker-compose up` and everything is set up automatically.
