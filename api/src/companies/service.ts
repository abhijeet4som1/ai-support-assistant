import { ConflictError, NotFoundError, type Company } from '@app/api-server-sdk';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { type Db, schema } from '../db/client.js';
import { isUniqueViolation } from '../db/errors.js';
import {
  loadLatestVersionsByCompany,
  loadVersionsById,
  toVersionSummary,
} from '../guidelines/mappers.js';

export interface CompaniesService {
  /** Company data is shared; `conversationCount` is the calling agent's own count, since conversations are private. */
  list(userId: string): Promise<Company[]>;
  get(id: string, userId: string): Promise<Company>;
  create(input: { name: string; description?: string; createdBy: string }): Promise<Company>;
  update(
    id: string,
    patch: { name?: string; description?: string },
    userId: string,
  ): Promise<Company>;
}

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ');
const blankToNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export function createCompaniesService(db: Db): CompaniesService {
  async function hydrate(rows: schema.Company[], userId: string): Promise<Company[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const activeIds = rows
      .map((r) => r.activeGuidelineVersionId)
      .filter((v): v is string => Boolean(v));
    const [active, latest, counts] = await Promise.all([
      loadVersionsById(db, activeIds),
      loadLatestVersionsByCompany(db, ids),
      db
        .select({ companyId: schema.conversations.companyId, count: sql<number>`count(*)::int` })
        .from(schema.conversations)
        .where(
          and(
            inArray(schema.conversations.companyId, ids),
            eq(schema.conversations.createdBy, userId),
          ),
        )
        .groupBy(schema.conversations.companyId),
    ]);
    const countBy = new Map(counts.map((c) => [c.companyId, c.count]));
    return rows.map((r) => {
      const activeV = r.activeGuidelineVersionId
        ? active.get(r.activeGuidelineVersionId)
        : undefined;
      const latestV = latest.get(r.id);
      return {
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        activeGuidelines: activeV
          ? toVersionSummary(activeV, r.activeGuidelineVersionId)
          : undefined,
        latestGuidelines: latestV
          ? toVersionSummary(latestV, r.activeGuidelineVersionId)
          : undefined,
        conversationCount: countBy.get(r.id) ?? 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  async function getRow(id: string) {
    const row = await db.query.companies.findFirst({ where: eq(schema.companies.id, id) });
    if (!row) throw new NotFoundError({ message: 'Company not found', resource: 'company', id });
    return row;
  }

  return {
    async list(userId) {
      const rows = await db.select().from(schema.companies).orderBy(asc(schema.companies.name));
      return hydrate(rows, userId);
    },
    async get(id, userId) {
      const [company] = await hydrate([await getRow(id)], userId);
      return company!;
    },
    async create(input) {
      const name = normalizeName(input.name);
      try {
        const [row] = await db
          .insert(schema.companies)
          .values({ name, description: blankToNull(input.description), createdBy: input.createdBy })
          .returning();
        const [company] = await hydrate([row!], input.createdBy);
        return company!;
      } catch (err) {
        if (isUniqueViolation(err))
          throw new ConflictError({ message: `A company named "${name}" already exists` });
        throw err;
      }
    },
    async update(id, patch, userId) {
      await getRow(id);
      const values: Partial<typeof schema.companies.$inferInsert> = {};
      if (patch.name !== undefined) values.name = normalizeName(patch.name);
      if (patch.description !== undefined) values.description = blankToNull(patch.description);
      try {
        const [row] = await db
          .update(schema.companies)
          .set(values)
          .where(eq(schema.companies.id, id))
          .returning();
        const [company] = await hydrate([row!], userId);
        return company!;
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ConflictError({ message: `A company named "${values.name}" already exists` });
        }
        throw err;
      }
    },
  };
}
