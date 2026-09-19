import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq, sql } from 'drizzle-orm';
import { type Logger } from 'pino';

import { type Db, schema } from './client.js';
import { seedUsers } from '../auth/users.js';
import { type GuidelinesService } from '../guidelines/service.js';

/** api/seed/guidelines relative to both src/db and dist/db. */
export const seedGuidelinesDir = fileURLToPath(new URL('../../seed/guidelines/', import.meta.url));

const SAMPLE_COMPANIES: { name: string; description: string; file: string }[] = [
  { name: 'Bookshop', description: 'Online bookstore', file: 'bookshop_support_guidelines.txt' },
  { name: 'VPN SaaS', description: 'VPN service provider', file: 'vpn_support_guidelines.txt' },
];

/**
 * Creates the demo companies and enqueues ingestion of their sample guideline files.
 * Idempotent: companies that already exist are left alone.
 */
export async function seedCompanies(db: Db, guidelines: GuidelinesService, log: Logger) {
  const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.companies);
  if ((count?.n ?? 0) > 0) return [];
  const seeder = await db.query.users.findFirst({ where: eq(schema.users.username, 'agent1') });
  const owner = seeder ?? (await db.query.users.findFirst());
  if (!owner) throw new Error('cannot seed companies: no users exist');

  const available = new Set(await readdir(seedGuidelinesDir));
  const created: string[] = [];
  for (const sample of SAMPLE_COMPANIES) {
    const [company] = await db
      .insert(schema.companies)
      .values({ name: sample.name, description: sample.description, createdBy: owner.id })
      .returning();
    created.push(sample.name);
    if (!available.has(sample.file)) {
      log.warn(
        { file: sample.file },
        'sample guideline file missing; company created without guidelines',
      );
      continue;
    }
    const body = await readFile(new URL(sample.file, `file://${seedGuidelinesDir}`));
    await guidelines.upload({
      companyId: company!.id,
      filename: sample.file,
      fileContentType: 'text/plain',
      body: new Uint8Array(body),
      userId: owner.id,
    });
  }
  return created;
}

export async function runSeed(
  db: Db,
  guidelines: GuidelinesService,
  log: Logger,
  seedUsersSpec: string,
) {
  const users = await seedUsers(db, seedUsersSpec);
  if (users.length) log.info({ users }, 'seeded users');
  const companies = await seedCompanies(db, guidelines, log);
  if (companies.length) log.info({ companies }, 'seeded companies (guideline ingestion queued)');
}
