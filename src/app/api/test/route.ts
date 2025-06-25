import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test database connection with timeout
    const client = await pool.connect();
    console.log('Got database client');
    
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('Query executed successfully');
    
    client.release();
    console.log('Client released');
    
    return NextResponse.json({ 
      status: 'success',
      message: 'API and Database working!',
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].postgres_version,
      connectionInfo: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPostgresUser: !!process.env.POSTGRES_USER,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasPostgresDatabase: !!process.env.POSTGRES_DATABASE,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
  } catch (error) {
    console.error('Test API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall
    });
    
    return NextResponse.json({ 
      status: 'error',
      message: 'API working, Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      timestamp: new Date().toISOString(),
      connectionInfo: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPostgresUser: !!process.env.POSTGRES_USER,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasPostgresDatabase: !!process.env.POSTGRES_DATABASE,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    }, { status: 500 });
  }
}