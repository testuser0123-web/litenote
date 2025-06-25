const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await pool.connect();
    
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM notes ORDER BY created_at DESC');
      client.release();
      res.json(result.rows);
    }
    
    else if (req.method === 'POST') {
      const { title, content } = req.body;
      const result = await client.query(
        'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
        [title, content]
      );
      client.release();
      res.json(result.rows[0]);
    }
    
    else if (req.method === 'PUT') {
      const { id } = req.query;
      const { title, content } = req.body;
      const result = await client.query(
        'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
        [title, content, id]
      );
      client.release();
      res.json(result.rows[0]);
    }
    
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query('DELETE FROM notes WHERE id = $1', [id]);
      client.release();
      res.json({ message: 'Note deleted' });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};