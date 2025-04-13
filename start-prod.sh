#!/bin/bash
# Script to start the application in production mode

# Note about database connection
echo "⚠️  IMPORTANT: Production database connection may require:"
echo "   - Updated database credentials in server/config.ts"
echo "   - SSH tunnel or VPN connection to the database server"
echo "   - Firewall configuration to allow remote connections"
echo ""

# Test database connection first
echo "Testing production database connection..."
node --experimental-specifier-resolution=node --experimental-modules test-connection-alt.js

echo "Building application for production..."
npm run build

echo "Starting server in production mode..."
NODE_ENV=production node dist/index.js