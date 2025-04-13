import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import config, { getDatabaseUrl } from './config';

// Set WebSocket constructor for neon
neonConfig.webSocketConstructor = ws;

// Log the current environment
console.log(`Running in ${config.isProduction ? 'production' : 'development'} mode`);

// Get the appropriate database URL
const connectionString = getDatabaseUrl();

// Connection options with improved error handling
const poolOptions = {
  connectionString,
  // Setting a timeout to avoid hanging on connection issues
  connectionTimeoutMillis: 10000
};

// Create database connection
// We'll first create the pool with our connection options
const pool = new Pool(poolOptions);

// Set up error handlers for the pool
pool.on('error', (err: Error) => {
  console.error('Unexpected database error:', err.message);
  console.error('If this happened in production, please check your database connection settings.');
  
  // Don't crash the server, but log error for investigation
  if (config.isProduction) {
    console.error('Using production database settings. Connection may require SSH tunnel or VPN.');
  }
});

// Initialize Drizzle ORM with our schema
const db = drizzle({ client: pool, schema });

// Test connection during startup
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connection established successfully');
}).catch((err: Error) => {
  console.error('❌ Database connection failed:', err.message);
  console.error('Application will continue but database operations will fail');
  
  if (config.isProduction) {
    console.error('Production database might require additional network configuration.');
    console.error('Run test-connection-alt.js to diagnose connection issues.');
  }
});

// Export the database connection objects
export { pool, db };
