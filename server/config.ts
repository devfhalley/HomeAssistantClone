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
// Updated with correct credentials
const productionConfig: AppConfig = {
  database: {
    host: '165.22.50.101', // Server IP
    port: 5432, 
    database: 'panel_utama', // Database name from pgAdmin
    user: 'root', // Username from pgAdmin
    password: 'rnd.admin1', // Updated with correct password
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
  
  // Special handling for production environment
  if (environment === 'production' || forceProduction) {
    // Check if DATABASE_URL environment variable is set in production
    // This allows overriding connection details at runtime
    if (process.env.PROD_DATABASE_URL) {
      console.log('Using production DATABASE_URL environment variable');
      return process.env.PROD_DATABASE_URL;
    }
    
    console.log(`Connecting to production database at ${host}:${port}/${database} as ${user}`);
  }
  
  // Properly URL-encode the username and password for special characters
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export default config;