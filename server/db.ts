import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Lazy initialization - only create pool when DATABASE_URL is available
// This prevents errors at import time in serverless environments
let _pool: pg.Pool | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?\n\n" +
        "To set up locally:\n" +
        "1. Create a .env file in the project root\n" +
        "2. Add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n" +
        "3. For a quick setup, use Docker: docker run --name neon-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neon -p 5432:5432 -d postgres:15\n" +
        "   Then use: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon\n" +
        "4. Or get a free database from: https://neon.tech\n" +
        "5. For Vercel: Add DATABASE_URL in Vercel project settings → Environment Variables"
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Use Proxy to make exports lazy - only initialize when actually accessed
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    const actualPool = getPool();
    const value = (actualPool as any)[prop];
    return typeof value === 'function' ? value.bind(actualPool) : value;
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const actualDb = getDb();
    const value = (actualDb as any)[prop];
    return typeof value === 'function' ? value.bind(actualDb) : value;
  }
});
