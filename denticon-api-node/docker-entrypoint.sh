#!/bin/sh

# Entrypoint script for Denticon API
# Runs migrations automatically before starting the server

set -e

echo "Starting Denticon API..."

# Run migrations
echo "Running database migrations..."
cd /app/database
./run-migrations.sh

# Go back to app directory
cd /app

# Start the application
echo "Starting Node.js server..."
exec "$@"
