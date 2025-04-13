// Alternative connection test that tries multiple configurations
import pg from 'pg';

const { Pool } = pg;

// Test multiple connection configurations
async function testConfigurations() {
  const connectionOptions = [
    {
      name: 'Direct IP connection',
      config: {
        host: '165.22.50.101',
        port: 5432,
        database: 'panel_utama',
        user: 'root',
        password: 'rnd.admin1'
      }
    },
    {
      name: 'Alternative IP connection',
      config: {
        host: '165.22.50.101',
        port: 5432,
        database: 'panel_utama',
        user: 'postgres', // Many installations use postgres as default user
        password: 'rnd.admin1'
      }
    },
    {
      name: 'Local connection with Docker hostname',
      config: {
        host: 'db',
        port: 5432,
        database: 'panel_utama',
        user: 'root',
        password: 'rnd.admin1'
      }
    }
  ];

  console.log('⚙️  Testing multiple database configurations...');
  
  for (const option of connectionOptions) {
    console.log(`\nTrying: ${option.name}`);
    console.log(`Host: ${option.config.host}`);
    console.log(`User: ${option.config.user}`);
    
    const pool = new Pool({
      ...option.config,
      // Set a shorter connection timeout
      connectionTimeoutMillis: 5000
    });
    
    try {
      const result = await pool.query('SELECT NOW() as time');
      console.log('✅ Connection successful!');
      console.log(`Server time: ${result.rows[0].time}`);
      
      // If we get here, connection works!
      console.log('\n🎉 Found working database configuration:');
      console.log(JSON.stringify(option.config, null, 2));
      
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
      
      // Close pool
      await pool.end();
      
      // End the loop - we found a working connection
      return true;
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      // Close pool and try next option
      await pool.end();
    }
  }
  
  console.log('\n❌ All connection attempts failed.');
  console.log('Please verify:\n');
  console.log('1. Database server is running and accessible from this network');
  console.log('2. Credentials are correct');
  console.log('3. Firewall allows connections from this IP');
  console.log('\nContinuing with local development database...');
  
  return false;
}

// Run the test
testConfigurations().catch(err => {
  console.error('Error running tests:', err);
});