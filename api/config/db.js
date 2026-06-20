import pg from 'pg';

const { Pool } = pg;

// Connection string resolves to local PostgreSQL fallback for testing/development
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fp_mbd';

export const pool = new Pool({
  connectionString,
  max: 10,                 // serverless environment requires smaller pools
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
