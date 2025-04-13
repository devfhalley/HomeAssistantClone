// Test script trying without password
import pg from 'pg';

const { Pool } = pg;

// Production database configuration with no password
const config = {
  host: '165.22.50.101',
  port: 5432,
  database: 'panel_utama',
  user: 'root',
  // No password - some PostgreSQL setups allow this for local connections
  password: ''
};

console.log('Testing connection without password...');
console.log(`Host: ${config.host}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

// Create a connection pool
const pool = new Pool(config);

// Test the connection
async function testConnection() {
  try {
    // Try a simple query
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${result.rows[0].time}`);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the test
testConnection();