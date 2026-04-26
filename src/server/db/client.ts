import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "@/server/env";
import * as schema from "./schema";

const { Pool } = pg;

const globalForDb = globalThis as unknown as {
  slickPool?: pg.Pool;
};

export const pool =
  globalForDb.slickPool ??
  new Pool({
    connectionString: env.DATABASE_URL
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.slickPool = pool;
}

export const db = drizzle(pool, { schema });
