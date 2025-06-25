const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM notes ORDER BY created_at DESC');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    await client.query('DELETE FROM notes WHERE id = $1', [id]);
    client.release();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});