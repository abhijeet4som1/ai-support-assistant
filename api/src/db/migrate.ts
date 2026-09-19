import { fileURLToPath } from 'node:url';

import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';

/** Works from both src/ (tsx) and dist/ (compiled): api/drizzle is two levels up. */
export const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export async function runMigrations(db: NodePgDatabase<Record<string, unknown>>): Promise<void> {
  await migratePg(db, { migrationsFolder });
}

// CLI usage: pnpm db:migrate
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { loadConfig } = await import('../config.js');
  const { createDb } = await import('./client.js');
  const cfg = loadConfig();
  const { db, close } = createDb(cfg.DATABASE_URL);
  await runMigrations(db);
  await close();
  console.warn('migrations applied');
}
