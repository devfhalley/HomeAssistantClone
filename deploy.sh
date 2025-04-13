#!/bin/bash

# Build the client-side application
echo "Building the client application..."
npm run build

# Run the special Replit production server
echo "Starting the production server..."
NODE_ENV=production node replit.js