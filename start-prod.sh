#!/bin/bash
# Script to start the application in production mode

echo "Building application for production..."
npm run build

echo "Starting server in production mode..."
NODE_ENV=production node dist/index.js