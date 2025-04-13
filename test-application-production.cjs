const { Client } = require('pg');
const { createServer } = require('http');

console.log('Testing production application connection...');
console.log('Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Query basic information
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const panel33Count = await client.query('SELECT COUNT(*) FROM panel_33kva');
    const panel66Count = await client.query('SELECT COUNT(*) FROM panel_66kva');
    const chartCount = await client.query('SELECT COUNT(*) FROM chart_data');
    
    console.log('Current record counts:');
    console.log(`- Users: ${userCount.rows[0].count}`);
    console.log(`- Panel 33KVA: ${panel33Count.rows[0].count}`);
    console.log(`- Panel 66KVA: ${panel66Count.rows[0].count}`);
    console.log(`- Chart Data: ${chartCount.rows[0].count}`);
    
    // Get a panel data record
    const panel33Data = await client.query('SELECT * FROM panel_33kva LIMIT 1');
    if (panel33Data.rows.length > 0) {
      console.log('\nSample Panel 33KVA data:');
      const data = panel33Data.rows[0];
      console.log(`- Voltages: R=${data.volt_r}V, S=${data.volt_s}V, T=${data.volt_t}V`);
      console.log(`- Currents: R=${data.arus_r}A, S=${data.arus_s}A, T=${data.arus_t}A`);
      console.log(`- Power: Net KW=${data.netkw}, Net KVA=${data.netkva}`);
    }
    
    // Test small HTTP server
    const PORT = process.env.PORT || 5001;
    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Production server is working!',
        database: 'connected',
        records: {
          users: userCount.rows[0].count,
          panel33kva: panel33Count.rows[0].count,
          panel66kva: panel66Count.rows[0].count,
          chartData: chartCount.rows[0].count
        }
      }));
    });
    
    server.listen(PORT, () => {
      console.log(`✅ Test server running on port ${PORT}`);
      console.log(`Try accessing: http://localhost:${PORT}/`);
    });
    
  } catch (err) {
    console.error('❌ Error connecting to database:', err);
  }
}

testConnection();