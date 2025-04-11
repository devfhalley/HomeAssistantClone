#!/bin/bash
# Database setup script for Power Monitoring application

set -e  # Exit on any error

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set."
    echo "Please set it to your PostgreSQL connection string like:"
    echo "export DATABASE_URL=postgresql://username:password@localhost:5432/power_monitoring"
    exit 1
fi

echo "Setting up database for Power Monitoring application..."

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "Using database: $DB_NAME"

# Run migration script
echo "Creating tables..."
psql $DATABASE_URL -f ./db/migrations/init.sql

# Seed the database with sample data
echo "Would you like to seed the database with sample data? (y/n)"
read answer

if [ "$answer" == "y" ] || [ "$answer" == "Y" ]; then
    echo "Seeding database with sample data..."
    psql $DATABASE_URL -f ./db/seed-data.sql
    echo "Database seeded successfully!"
else
    echo "Skipping data seeding."
fi

echo "Database setup complete!"
echo "You can now run the application with: npm run dev"