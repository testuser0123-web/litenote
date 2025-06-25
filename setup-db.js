const { Pool } = require('pg');
require('dotenv').config();

console.log('Checking environment...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  let client;
  try {
    console.log('Connecting to Neon database...');
    client = await pool.connect();
    console.log('Connected successfully!');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Notes table created successfully');
    
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

setupDatabase();