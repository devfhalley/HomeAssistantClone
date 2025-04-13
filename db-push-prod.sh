#!/bin/bash
# Script to push database schema changes to production

echo "Pushing database schema to production database..."
NODE_ENV=production npx drizzle-kit push