import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM notes ORDER BY created_at DESC');
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    client.release();
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { title, content } = await request.json();
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    client.release();
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const client = await pool.connect();
    await client.query('DELETE FROM notes WHERE id = $1', [id]);
    client.release();
    return NextResponse.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}