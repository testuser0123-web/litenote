import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../lib/db';
import { authOptions } from '../../../lib/auth';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    console.log('GET /api/notes - Checking session...');
    const session = await getServerSession(authOptions);
    console.log('Session retrieved:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      userId: session?.user?.id 
    });
    
    if (!session?.user?.id) {
      console.log('No valid session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // First ensure the table exists
    const client = await pool.connect();
    
    // Create table if it doesn't exist and add user_id column
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add user_id column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'notes' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `);
    
    // Update timestamp columns to include timezone
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'notes' AND column_name = 'created_at' 
          AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE notes 
          ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
          ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `);
    
    // Add is_favorite column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'notes' AND column_name = 'is_favorite'
        ) THEN
          ALTER TABLE notes ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    
    // Create note_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS note_images (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get notes with images
    const result = await client.query(
      `SELECT n.*, 
       json_agg(
         json_build_object(
           'id', ni.id,
           'note_id', ni.note_id,
           'image_url', ni.image_url,
           'filename', ni.filename,
           'created_at', ni.created_at
         ) ORDER BY ni.created_at
       ) FILTER (WHERE ni.id IS NOT NULL) as images
       FROM notes n
       LEFT JOIN note_images ni ON n.id = ni.note_id
       WHERE n.user_id = $1
       GROUP BY n.id
       ORDER BY n.created_at DESC`,
      [session.user.id]
    );
    client.release();
    return NextResponse.json(result.rows, { headers: corsHeaders });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/notes - Checking session...');
    const session = await getServerSession(authOptions);
    console.log('Session for POST:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      userId: session?.user?.id 
    });
    
    if (!session?.user?.id) {
      console.log('POST - No valid session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { title, content } = await request.json();
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, session.user.id]
    );
    client.release();
    return NextResponse.json(result.rows[0], { headers: corsHeaders });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { title, content } = await request.json();
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, id, session.user.id]
    );
    client.release();
    return NextResponse.json(result.rows[0], { headers: corsHeaders });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const client = await pool.connect();
    
    // Get images before deleting note to clean up physical files
    const imagesResult = await client.query(
      'SELECT image_url FROM note_images WHERE note_id = $1',
      [id]
    );
    
    // Delete note (CASCADE will automatically delete images from database)
    await client.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [id, session.user.id]);
    client.release();
    
    // Delete blob files
    if (imagesResult.rows.length > 0) {
      const { del } = require('@vercel/blob');
      
      for (const row of imagesResult.rows) {
        try {
          await del(row.image_url);
          console.log('Blob file deleted:', row.image_url);
        } catch (error) {
          console.error('Error deleting blob file:', error);
        }
      }
    }
    
    return NextResponse.json({ message: 'Note deleted' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}