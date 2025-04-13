#!/bin/bash
# Script to start the application in production mode

echo "Starting server in production mode..."
NODE_ENV=production tsx server/index.ts