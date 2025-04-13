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

// Create database connection
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
