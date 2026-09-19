/**
 * Hermetic Postgres for tests: PGlite (in-process, WASM) with the pgvector extension,
 * migrated with the same SQL migrations production uses.
 */
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { type Db, schema } from '../../src/db/client.js';
import { migrationsFolder } from '../../src/db/migrate.js';

export async function createTestDb() {
  const client = new PGlite({ extensions: { vector } });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db: db as unknown as Db, close: () => client.close() };
}
