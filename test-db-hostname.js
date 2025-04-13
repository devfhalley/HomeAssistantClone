// Test script trying alternative hostname
import pg from 'pg';
import { hostname } from 'os';

const { Pool } = pg;

// Try with "db" as hostname as shown in pgAdmin
const config = {
  host: 'db', // Using the hostname from pgAdmin instead of IP
  port: 5432,
  database: 'panel_utama',
  user: 'root',
  password: 'Admin*46835Intek'
};

console.log('Testing connection using pgAdmin hostname "db"...');
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
    
    // Check if our tables exist
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
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the test
testConnection();