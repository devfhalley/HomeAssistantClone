#!/bin/bash
# Script to start the application in production mode

# Note about database connection
echo "⚠️  IMPORTANT: Production database connection instructions:"
echo "   1. If you're running this on the server with PostgreSQL, set the DATABASE_URL:"
echo "      export PROD_DATABASE_URL='postgres://root:rnd.admin1@localhost:5432/panel_utama'"
echo ""
echo "   2. If you're running this on a different server, you can either:"
echo "      - Update credentials in server/config.ts"
echo "      - Set the PROD_DATABASE_URL environment variable"
echo "      - Set up an SSH tunnel: ssh -L 5432:localhost:5432 user@165.22.50.101"
echo ""
echo "   3. If all else fails, you can force development mode with local database:"
echo "      NODE_ENV=development ./start-prod.sh"
echo ""

# Test database connection first
echo "Testing production database connection..."
node --experimental-specifier-resolution=node --experimental-modules test-connection-alt.js

echo "Building application for production..."
npm run build

echo "Starting server in production mode..."
NODE_ENV=production node dist/index.js