import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?\n\n" +
    "To set up locally:\n" +
    "1. Create a .env file in the project root\n" +
    "2. Add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n" +
    "3. For a quick setup, use Docker: docker run --name neon-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neon -p 5432:5432 -d postgres:15\n" +
    "   Then use: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon\n" +
    "4. Or get a free database from: https://neon.tech"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
