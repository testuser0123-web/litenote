// Test endpoint to check database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Test database connection
    const result = await client.query('SELECT NOW() as current_time');
    
    // Check if notes table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
      );
    `);
    
    client.release();
    
    res.json({
      status: 'Database connected',
      time: result.rows[0].current_time,
      notesTableExists: tableCheck.rows[0].exists,
      env: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: err.message 
    });
  }
};