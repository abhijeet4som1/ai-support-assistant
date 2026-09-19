import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core';
import pg from 'pg';

import * as schema from './schema.js';

/** Driver-agnostic database type so production (node-postgres) and tests (PGlite) share code. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(connectionString: string): {
  db: NodePgDatabase<typeof schema>;
  close: () => Promise<void>;
} {
  const pool = new pg.Pool({ connectionString, max: 10 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}

export { schema };
