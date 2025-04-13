import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Force production mode
process.env.FORCE_PRODUCTION = 'true';

// Import our schema
import { 
  users, 
  panel33kva, 
  panel66kva, 
  chartData 
} from './shared/schema.js';

const connectionString = process.env.DATABASE_URL;

console.log('Setting up production database...');
console.log(`Connecting to: ${connectionString.replace(/:[^:]*@/, ':****@')}`);

const pool = new Pool({ connectionString });

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating tables...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created users table');
    
    // Create panel_33kva table
    await client.query(`
      CREATE TABLE IF NOT EXISTS panel_33kva (
        id SERIAL PRIMARY KEY,
        volt_r TEXT NOT NULL,
        volt_s TEXT NOT NULL,
        volt_t TEXT NOT NULL,
        arus_r TEXT NOT NULL,
        arus_s TEXT NOT NULL,
        arus_t TEXT NOT NULL,
        kvah TEXT NOT NULL,
        kva_r TEXT NOT NULL,
        kva_s TEXT NOT NULL,
        kva_t TEXT NOT NULL,
        netkw TEXT NOT NULL,
        netkva TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created panel_33kva table');
    
    // Create panel_66kva table
    await client.query(`
      CREATE TABLE IF NOT EXISTS panel_66kva (
        id SERIAL PRIMARY KEY,
        volt_r TEXT NOT NULL,
        volt_s TEXT NOT NULL,
        volt_t TEXT NOT NULL,
        arus_r TEXT NOT NULL,
        arus_s TEXT NOT NULL,
        arus_t TEXT NOT NULL,
        kvah TEXT NOT NULL,
        kva_r TEXT NOT NULL,
        kva_s TEXT NOT NULL,
        kva_t TEXT NOT NULL,
        netkw TEXT NOT NULL,
        netkva TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created panel_66kva table');
    
    // Create chart_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id SERIAL PRIMARY KEY,
        data_type TEXT NOT NULL,
        phase TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created chart_data table');
    
    console.log('All tables created successfully!');
    console.log('Checking database tables...');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in database:');
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables().catch(console.error);