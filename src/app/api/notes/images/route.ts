import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/notes/images - Adding image...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('POST - No valid session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const formData = await request.formData();
    const noteId = formData.get('noteId') as string;
    const file = formData.get('image') as File;
    
    if (!noteId || !file) {
      return NextResponse.json({ error: 'Note ID and image are required' }, { status: 400, headers: corsHeaders });
    }

    // Verify note ownership
    const client = await pool.connect();
    const noteCheck = await client.query(
      'SELECT id FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, session.user.id]
    );
    
    if (noteCheck.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Note not found' }, { status: 404, headers: corsHeaders });
    }

    // Generate unique filename with .jpg extension (unified)
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.jpg`;
    
    // Save file to public/uploads directory with compression
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Compress image if it's too large
    let finalBuffer = buffer;
    if (buffer.length > 1024 * 1024) { // If larger than 1MB
      try {
        const sharp = require('sharp');
        finalBuffer = await sharp(buffer)
          .jpeg({ quality: 80 })
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .toBuffer();
      } catch (error) {
        console.log('Sharp not available, using original file');
        finalBuffer = buffer;
      }
    }
    
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, finalBuffer);
    
    // Create URL path
    const imageUrl = `/uploads/${uniqueFilename}`;
    
    // Save image reference to database
    const result = await client.query(
      'INSERT INTO note_images (note_id, image_url, filename) VALUES ($1, $2, $3) RETURNING *',
      [noteId, imageUrl, file.name]
    );
    
    client.release();
    console.log('Image added:', result.rows[0]);
    return NextResponse.json(result.rows[0], { headers: corsHeaders });
  } catch (error) {
    console.error('Image upload error:', error);
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
    console.log('DELETE /api/notes/images - Deleting image...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');
    
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400, headers: corsHeaders });
    }

    const client = await pool.connect();
    
    // Get image info before deleting
    const imageResult = await client.query(
      `SELECT ni.* FROM note_images ni
       JOIN notes n ON ni.note_id = n.id
       WHERE ni.id = $1 AND n.user_id = $2`,
      [imageId, session.user.id]
    );
    
    if (imageResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Image not found' }, { status: 404, headers: corsHeaders });
    }
    
    const imageInfo = imageResult.rows[0];
    
    // Delete from database
    const result = await client.query(
      `DELETE FROM note_images 
       WHERE id = $1 
       AND note_id IN (SELECT id FROM notes WHERE user_id = $2)
       RETURNING *`,
      [imageId, session.user.id]
    );
    
    client.release();
    
    // Delete physical file if it's a local file (not base64)
    if (imageInfo.image_url.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', imageInfo.image_url);
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Physical file deleted:', filePath);
        }
      } catch (error) {
        console.error('Error deleting physical file:', error);
      }
    }
    
    console.log('Image deleted:', imageId);
    return NextResponse.json({ message: 'Image deleted' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}