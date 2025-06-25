import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/notes/favorite - Checking session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('POST - No valid session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400, headers: corsHeaders });
    }

    const client = await pool.connect();
    
    // Toggle favorite status
    const result = await client.query(
      'UPDATE notes SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, session.user.id]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404, headers: corsHeaders });
    }
    
    console.log('Toggled favorite for note:', id, 'New status:', result.rows[0].is_favorite);
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