#!/bin/bash
# Database migration script for Power Monitoring application

set -e  # Exit on any error

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set."
    echo "Please set it to your PostgreSQL connection string like:"
    echo "export DATABASE_URL=postgresql://username:password@localhost:5432/power_monitoring"
    exit 1
fi

# Check if migration file name is provided
if [ -z "$1" ]; then
    echo "Error: No migration file specified."
    echo "Usage: ./db/migrate.sh <migration_file_name>"
    echo "Available migrations:"
    ls -1 ./db/migrations/ | grep -v "init.sql"
    exit 1
fi

MIGRATION_FILE="./db/migrations/$1"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file '$MIGRATION_FILE' not found."
    echo "Available migrations:"
    ls -1 ./db/migrations/
    exit 1
fi

echo "Running migration from $MIGRATION_FILE..."

# Run the migration
psql $DATABASE_URL -f "$MIGRATION_FILE"

echo "Migration completed successfully!"