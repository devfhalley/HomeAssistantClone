import config from './server/config';

// Construct the PostgreSQL connection URL
const { host, port, database, user, password } = config.database;
const connectionUrl = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

// Set the DATABASE_URL environment variable before running drizzle-kit
process.env.DATABASE_URL = connectionUrl;

console.log(`Database URL set to production database at ${host}:${port}`);
console.log(`Run 'npx drizzle-kit push' to apply schema changes to the production database.`);