// Test script for PostgreSQL connection - alternative formats
import pg from 'pg';
import { hostname } from 'os';

const { Pool } = pg;

// Try different username formats
const configs = [
  {
    host: '165.22.50.101',
    port: 5432,
    database: 'postgres',
    user: 'admin@intek.co.id',
    password: 'Admin*46835Intek',
    name: 'Original format'
  },
  {
    host: '165.22.50.101',
    port: 5432,
    database: 'postgres',
    user: 'admin',
    password: 'Admin*46835Intek',
    name: 'Username only'
  },
  {
    host: '165.22.50.101',
    port: 5432,
    database: 'postgres',
    user: '"admin@intek.co.id"',
    password: 'Admin*46835Intek',
    name: 'Quoted username'
  },
  {
    host: '165.22.50.101',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Admin*46835Intek',
    name: 'Default postgres user'
  }
];

// Test each configuration
async function testConfigurations() {
  for (const config of configs) {
    console.log(`\n\nTesting: ${config.name}`);
    console.log(`Host: ${config.host}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      // Set a shorter connection timeout
      connectionTimeoutMillis: 5000
    });
    
    try {
      const result = await pool.query('SELECT NOW() as time');
      console.log('✅ Connection successful!');
      console.log(`Server time: ${result.rows[0].time}`);
      
      // If connection is successful, check tables
      try {
        const tableResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        
        console.log('Available tables:');
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
      
      // Since we found a working configuration, stop testing
      break;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
    } finally {
      await pool.end();
    }
  }
}

// Run the tests
testConfigurations();