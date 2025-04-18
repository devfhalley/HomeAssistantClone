// Test script for PostgreSQL connection using pg package and updated credentials
import pg from 'pg';
import { hostname } from 'os';

const { Pool } = pg;

// Production database configuration with correct credentials
const config = {
  host: '165.22.50.101',
  port: 5432,
  database: 'panel_utama',
  user: 'root',
  password: 'rnd.admin1'
};

console.log('Testing connection to production database using pg...');
console.log(`Host: ${config.host}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);
console.log(`Connection from: ${hostname()}`);

// Create a connection pool
const pool = new Pool(config);

// Test the connection
async function testConnection() {
  try {
    // Try a simple query
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${result.rows[0].time}`);
    
    // Check if our tables exist
    try {
      const tableResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nAvailable tables:');
      if (tableResult.rows.length === 0) {
        console.log('No tables found in the database.');
      } else {
        tableResult.rows.forEach(row => {
          console.log(`- ${row.table_name}`);
        });
      }
    } catch (tableError) {
      console.error('Error checking tables:', tableError.message);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the test
testConnection();