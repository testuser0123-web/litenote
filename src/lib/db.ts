import { Pool } from 'pg';

// Vercel Postgres environment variables (auto-set by Connect Storage)
const {
  POSTGRES_URL,
  POSTGRES_PRISMA_URL,
  POSTGRES_URL_NO_SSL,
  POSTGRES_URL_NON_POOLING,
  POSTGRES_USER,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  DATABASE_URL
} = process.env;

// Log all available environment variables for debugging
console.log('All database environment variables:', {
  hasPostgresUrl: !!POSTGRES_URL,
  hasPostgresPrismaUrl: !!POSTGRES_PRISMA_URL,
  hasPostgresUrlNoSsl: !!POSTGRES_URL_NO_SSL,
  hasPostgresUrlNonPooling: !!POSTGRES_URL_NON_POOLING,
  hasPostgresUser: !!POSTGRES_USER,
  hasPostgresHost: !!POSTGRES_HOST,
  hasPostgresPassword: !!POSTGRES_PASSWORD,
  hasPostgresDatabase: !!POSTGRES_DATABASE,
  hasDatabaseUrl: !!DATABASE_URL,
  nodeEnv: process.env.NODE_ENV
});

// Try different connection methods for Vercel Postgres
let connectionConfig;

if (POSTGRES_URL) {
  // Use Vercel's primary connection string
  connectionConfig = {
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  };
  console.log('Using POSTGRES_URL connection');
} else if (POSTGRES_PRISMA_URL) {
  // Fallback to Prisma URL
  connectionConfig = {
    connectionString: POSTGRES_PRISMA_URL,
    ssl: { rejectUnauthorized: false }
  };
  console.log('Using POSTGRES_PRISMA_URL connection');
} else if (POSTGRES_USER && POSTGRES_HOST && POSTGRES_PASSWORD && POSTGRES_DATABASE) {
  // Manual configuration using individual variables
  connectionConfig = {
    user: POSTGRES_USER,
    host: POSTGRES_HOST,
    database: POSTGRES_DATABASE,
    password: POSTGRES_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false }
  };
  console.log('Using individual Postgres environment variables');
} else if (DATABASE_URL) {
  // Last resort: generic DATABASE_URL
  connectionConfig = {
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
  console.log('Using DATABASE_URL connection');
} else {
  console.error('No valid database connection configuration found!');
  console.error('Available env vars:', Object.keys(process.env).filter(key => 
    key.includes('POSTGRES') || key.includes('DATABASE')
  ));
  throw new Error('Database connection configuration missing');
}

const pool = new Pool({
  ...connectionConfig,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
  // Add retry logic
  keepAlive: true
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export default pool;