// Test script for PostgreSQL connection with URI format
import pg from 'pg';

const { Pool } = pg;

// Let's try URI format
const connectionString = 'postgres://root:rnd.admin1@165.22.50.101:5432/panel_utama';

console.log('Testing connection using connection string URI format...');
console.log(`Connection string (masked password): ${connectionString.replace(/:[^:]*@/, ':****@')}`);

// Create a connection pool
const pool = new Pool({ 
  connectionString,
  // Try a longer connection timeout
  connectionTimeoutMillis: 15000
});

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
    
    console.log('\nPossible reasons for connection failure:');
    console.log('1. PostgreSQL server is not configured to accept connections from external IP addresses');
    console.log('2. There might be firewall rules blocking the connection');
    console.log('3. The provided credentials might be incorrect');
    console.log('4. The database name might be wrong');
    console.log('5. The host might be an internal alias not accessible from outside');
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the test
testConnection();