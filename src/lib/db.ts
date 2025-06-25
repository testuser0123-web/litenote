import { Pool } from 'pg';

// Log environment for debugging
console.log('Database environment check:', {
  hasPostgresUrl: !!process.env.POSTGRES_URL,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV
});

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('No database connection string found. Please set POSTGRES_URL or DATABASE_URL environment variable.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : {
    rejectUnauthorized: false
  },
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

export default pool;