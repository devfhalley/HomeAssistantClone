#!/bin/bash
# Script to push database schema changes to production

echo "Setting up production database environment..."
NODE_ENV=production tsx db-prod.ts

echo "Pushing database schema to production database..."
npx drizzle-kit push

echo "Schema push complete!"