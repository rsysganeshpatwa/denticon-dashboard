#!/bin/sh

# Denticon Database Migration Runner
# This script runs all pending migrations automatically

set -e  # Exit on error

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-denticon}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-denticon_password_2024}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

printf "${GREEN}================================${NC}\n"
printf "${GREEN}Denticon Migration Runner${NC}\n"
printf "${GREEN}================================${NC}\n\n"

# Wait for database to be ready
printf "${YELLOW}Waiting for database to be ready...${NC}\n"
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
printf "${GREEN}✓ Database is ready!${NC}\n\n"

# Create migrations tracking table if it doesn't exist
printf "${YELLOW}Setting up migrations tracking table...${NC}\n"
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
EOSQL
printf "${GREEN}✓ Migrations tracking table ready${NC}\n\n"

# Get list of migration files
MIGRATION_DIR="$(dirname "$0")"

# Count migration files
MIGRATION_COUNT=0
for f in "$MIGRATION_DIR"/migration-*.sql; do
  [ -e "$f" ] || continue
  MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
done

if [ "$MIGRATION_COUNT" -eq 0 ]; then
  printf "${YELLOW}No migration files found${NC}\n"
  exit 0
fi

printf "${YELLOW}Found ${MIGRATION_COUNT} migration file(s)${NC}\n\n"

# Run each migration
APPLIED_COUNT=0
SKIPPED_COUNT=0

for MIGRATION_FILE in "$MIGRATION_DIR"/migration-*.sql; do
  [ -e "$MIGRATION_FILE" ] || continue
  
  MIGRATION_NAME=$(basename "$MIGRATION_FILE")
  
  # Check if migration has already been applied
  ALREADY_APPLIED=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$MIGRATION_NAME';")
  
  if [ "$ALREADY_APPLIED" -gt 0 ]; then
    printf "${YELLOW}⊘ Skipping $MIGRATION_NAME (already applied)${NC}\n"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  printf "${YELLOW}→ Applying $MIGRATION_NAME...${NC}\n"
  
  # Apply the migration
  if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"; then
    # Record the migration as applied
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c \
      "INSERT INTO schema_migrations (migration_name) VALUES ('$MIGRATION_NAME');"
    printf "${GREEN}✓ Successfully applied $MIGRATION_NAME${NC}\n\n"
    APPLIED_COUNT=$((APPLIED_COUNT + 1))
  else
    printf "${RED}✗ Failed to apply $MIGRATION_NAME${NC}\n"
    exit 1
  fi
done

# Summary
printf "${GREEN}================================${NC}\n"
printf "${GREEN}Migration Summary:${NC}\n"
printf "  Applied: ${GREEN}${APPLIED_COUNT}${NC}\n"
printf "  Skipped: ${YELLOW}${SKIPPED_COUNT}${NC}\n"
printf "  Total: ${MIGRATION_COUNT}\n"
printf "${GREEN}================================${NC}\n"
