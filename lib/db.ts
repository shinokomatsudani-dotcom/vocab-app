import "server-only";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

declare global {
  var __pgPool: Pool | undefined;
  var __schemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!globalThis.__pgPool) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    attachDatabasePool(pool);
    globalThis.__pgPool = pool;
  }
  return globalThis.__pgPool;
}

/** 初回アクセス時にテーブルを用意してから Pool を返す */
export async function db(): Promise<Pool> {
  const pool = getPool();
  globalThis.__schemaReady ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS words (
        id text PRIMARY KEY,
        term text NOT NULL,
        meanings jsonb NOT NULL DEFAULT '[]',
        category text NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )`
    )
    .then(() => undefined)
    .catch((error) => {
      globalThis.__schemaReady = undefined;
      throw error;
    });
  await globalThis.__schemaReady;
  return pool;
}
