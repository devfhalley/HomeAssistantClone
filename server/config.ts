// Environment-specific configuration

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface AppConfig {
  database: DatabaseConfig;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Development configuration uses Replit's built-in database
const developmentConfig: AppConfig = {
  database: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
  },
  isDevelopment: true,
  isProduction: false
};

// Production configuration uses external database
const productionConfig: AppConfig = {
  database: {
    host: '165.22.50.101',
    port: 5432,
    database: 'postgres', // Default database name - update if different
    user: 'admin@intek.co.id',
    password: 'Admin*46835Intek',
  },
  isDevelopment: false,
  isProduction: true
};

// Check for force production mode environment variable
const forceProduction = process.env.FORCE_PRODUCTION === 'true';

// Determine which config to use based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';
const config: AppConfig = (environment === 'production' || forceProduction)
  ? productionConfig 
  : developmentConfig;

// Helper function to generate a connection string
export function getDatabaseUrl(): string {
  if (environment === 'development' && !forceProduction && process.env.DATABASE_URL) {
    // Use Replit's DATABASE_URL in development if available and not forcing production
    return process.env.DATABASE_URL;
  }
  
  const { host, port, database, user, password } = config.database;
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export default config;