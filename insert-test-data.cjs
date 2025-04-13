const { Client } = require('pg');

async function insertTestData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Insert test user
    const userResult = await client.query(`
      INSERT INTO users (username, password_hash)
      VALUES ('admin', '$2b$10$FGY45KJbqeKgHSgSi/l8puWd7fja7xJH3hC9uIGlzd3VvCiV88efe')
      RETURNING id;
    `);
    console.log(`✅ Created test user with ID: ${userResult.rows[0].id}`);
    
    // Insert test panel_33kva data
    const panel33Result = await client.query(`
      INSERT INTO panel_33kva (
        volt_r, volt_s, volt_t, 
        arus_r, arus_s, arus_t, 
        kvah, kva_r, kva_s, kva_t, 
        netkw, netkva
      )
      VALUES (
        '220.5', '218.2', '221.0',
        '12.8', '13.2', '12.5',
        '28.6', '9.8', '8.9', '9.9',
        '26.7', '28.1'
      )
      RETURNING id;
    `);
    console.log(`✅ Created test panel_33kva data with ID: ${panel33Result.rows[0].id}`);
    
    // Insert test panel_66kva data
    const panel66Result = await client.query(`
      INSERT INTO panel_66kva (
        volt_r, volt_s, volt_t, 
        arus_r, arus_s, arus_t, 
        kvah, kva_r, kva_s, kva_t, 
        netkw, netkva
      )
      VALUES (
        '221.3', '220.7', '219.8',
        '25.6', '26.1', '25.9',
        '57.2', '19.5', '19.2', '18.5',
        '53.8', '57.0'
      )
      RETURNING id;
    `);
    console.log(`✅ Created test panel_66kva data with ID: ${panel66Result.rows[0].id}`);
    
    // Insert some chart data for testing
    const dataTypes = ['voltage', 'current', 'power'];
    const phases = ['R', 'S', 'T'];
    
    for (const dataType of dataTypes) {
      for (const phase of phases) {
        const value = Math.round(Math.random() * 100 * 10) / 10; // Random value with 1 decimal place
        
        const chartResult = await client.query(`
          INSERT INTO chart_data (data_type, phase, value)
          VALUES ($1, $2, $3)
          RETURNING id;
        `, [dataType, phase, value]);
        
        console.log(`✅ Created ${dataType} chart data for phase ${phase} with ID: ${chartResult.rows[0].id}`);
      }
    }
    
    console.log('✅ All test data inserted successfully');
    
    // Query to verify the data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const panel33Count = await client.query('SELECT COUNT(*) FROM panel_33kva');
    const panel66Count = await client.query('SELECT COUNT(*) FROM panel_66kva');
    const chartCount = await client.query('SELECT COUNT(*) FROM chart_data');
    
    console.log('Current record counts:');
    console.log(`- Users: ${userCount.rows[0].count}`);
    console.log(`- Panel 33KVA: ${panel33Count.rows[0].count}`);
    console.log(`- Panel 66KVA: ${panel66Count.rows[0].count}`);
    console.log(`- Chart Data: ${chartCount.rows[0].count}`);
    
  } catch (err) {
    console.error('Error inserting test data:', err);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

insertTestData();
