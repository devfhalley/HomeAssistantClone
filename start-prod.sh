#!/bin/bash
# Script to start the application in production mode

# Note about database connection
echo "⚠️  IMPORTANT: Docker Database Connection Instructions:"
echo ""
echo "  1. If running in Docker with docker-compose:"
echo "     - The application will automatically connect to 'postgres' service"
echo "     - No additional configuration needed if in the same Docker network"
echo ""
echo "  2. If running outside Docker but on the same server:"
echo "     - Use localhost connection: export PROD_DATABASE_URL='postgres://root:rnd.admin1@localhost:5432/panel_utama'"
echo ""
echo "  3. If running on a different server:"
echo "     - Try direct IP: export USE_SERVER_IP=true"
echo "     - Or set up an SSH tunnel: ssh -L 5432:localhost:5432 user@165.22.50.101"
echo ""
echo "  4. If all else fails, use development mode with local database:"
echo "     NODE_ENV=development ./start-prod.sh"
echo ""

# Test database connection first
echo "Testing production database connection..."
node --experimental-specifier-resolution=node --experimental-modules test-connection-alt.js

echo "Building application for production..."
npm run build

echo "Starting server in production mode..."
NODE_ENV=production node dist/index.js