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

// Production configuration for Docker environment
const productionConfig: AppConfig = {
  database: {
    // When running in the same Docker network, use the service name
    host: 'postgres', // Docker service name from docker-compose.yml
    port: 5432, 
    database: 'panel_utama', 
    user: 'root', 
    password: 'rnd.admin1',
  },
  isDevelopment: false,
  isProduction: true
};

// Alternative configuration for direct server IP
// Use this by setting ENV_USE_SERVER_IP=true 
const serverIpConfig: AppConfig = {
  database: {
    host: '165.22.50.101', // Server IP - only works if PostgreSQL allows remote connections
    port: 5432, 
    database: 'panel_utama', 
    user: 'root', 
    password: 'rnd.admin1',
  },
  isDevelopment: false,
  isProduction: true
};

// Check for force production mode environment variable
const forceProduction = process.env.FORCE_PRODUCTION === 'true';

// Determine which config to use based on NODE_ENV and other flags
const environment = process.env.NODE_ENV || 'development';
// Always use server IP in this development environment for testing
const useServerIp = true; // process.env.USE_SERVER_IP === 'true' || forceProduction;

// Force development configuration (for testing)
const forceDevelopment = process.env.FORCE_DEVELOPMENT === 'true';

// Select the appropriate configuration
let config: AppConfig;
if ((environment === 'development' && !forceProduction) || forceDevelopment) {
  // Use development config if in dev mode or if explicitly forcing development config
  config = developmentConfig;
} else if (useServerIp) {
  // Use the direct server IP configuration if explicitly requested or if FORCE_PRODUCTION is true
  console.log("Using direct server IP configuration (165.22.50.101)");
  config = serverIpConfig;
} else {
  // Default production config (Docker setup)
  config = productionConfig;
}

// Helper function to generate a connection string
export function getDatabaseUrl(): string {
  // Testing with production database
  const prodUrl = 'postgres://root:rnd.admin1@165.22.50.101:5432/panel_utama';
  console.log('Using production database:', prodUrl.replace(/:[^:]*@/, ':****@'));
  return prodUrl;
  
  // Comment out all the fallback code since we're testing with production DB only
  /*
  // If we're forcing development config but in production mode
  if (forceDevelopment) {
    if (process.env.DATABASE_URL) {
      console.log('Using development database in production mode (forced)');
      console.log(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
      return process.env.DATABASE_URL;
    } else {
      console.log('FORCE_DEVELOPMENT is set but DATABASE_URL is missing');
    }
  }
  
  // Normal development mode case
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
  */
}

export default config;