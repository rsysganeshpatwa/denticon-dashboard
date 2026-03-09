#!/bin/bash

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

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Denticon Migration Runner${NC}"
echo -e "${GREEN}================================${NC}\n"

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo -e "${GREEN}✓ Database is ready!${NC}\n"

# Create migrations tracking table if it doesn't exist
echo -e "${YELLOW}Setting up migrations tracking table...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
EOSQL
echo -e "${GREEN}✓ Migrations tracking table ready${NC}\n"

# Get list of migration files
MIGRATION_DIR="$(dirname "$0")"
MIGRATIONS=($(ls -1 "$MIGRATION_DIR"/migration-*.sql 2>/dev/null | sort))

if [ ${#MIGRATIONS[@]} -eq 0 ]; then
  echo -e "${YELLOW}No migration files found${NC}"
  exit 0
fi

echo -e "${YELLOW}Found ${#MIGRATIONS[@]} migration file(s)${NC}\n"

# Run each migration
APPLIED_COUNT=0
SKIPPED_COUNT=0

for MIGRATION_FILE in "${MIGRATIONS[@]}"; do
  MIGRATION_NAME=$(basename "$MIGRATION_FILE")
  
  # Check if migration has already been applied
  ALREADY_APPLIED=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$MIGRATION_NAME';")
  
  if [ "$ALREADY_APPLIED" -gt 0 ]; then
    echo -e "${YELLOW}⊘ Skipping $MIGRATION_NAME (already applied)${NC}"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  echo -e "${YELLOW}→ Applying $MIGRATION_NAME...${NC}"
  
  # Apply the migration
  if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"; then
    # Record the migration as applied
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c \
      "INSERT INTO schema_migrations (migration_name) VALUES ('$MIGRATION_NAME');"
    echo -e "${GREEN}✓ Successfully applied $MIGRATION_NAME${NC}\n"
    APPLIED_COUNT=$((APPLIED_COUNT + 1))
  else
    echo -e "${RED}✗ Failed to apply $MIGRATION_NAME${NC}"
    exit 1
  fi
done

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Migration Summary:${NC}"
echo -e "  Applied: ${GREEN}$APPLIED_COUNT${NC}"
echo -e "  Skipped: ${YELLOW}$SKIPPED_COUNT${NC}"
echo -e "  Total: ${#MIGRATIONS[@]}"
echo -e "${GREEN}================================${NC}"
