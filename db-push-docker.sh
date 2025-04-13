#!/bin/bash
# Script to push database schema to Docker PostgreSQL

echo "Setting up database schema for Docker PostgreSQL..."
echo "Using connection: postgres://root:****@postgres:5432/panel_utama"

# Push schema to Docker PostgreSQL
NODE_ENV=production npx drizzle-kit push

echo "Database schema push complete!"
echo "You can now start the application with NODE_ENV=production npm start"