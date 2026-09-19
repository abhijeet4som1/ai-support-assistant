import { type GuidelineVersionSummary } from '@app/api-server-sdk';
import { desc, eq, inArray, sql } from 'drizzle-orm';

import { type Db, schema } from '../db/client.js';

export type VersionWithUploader = schema.GuidelineVersion & { uploader: schema.User };

export function toVersionSummary(
  v: VersionWithUploader,
  activeVersionId: string | null,
): GuidelineVersionSummary {
  return {
    id: v.id,
    companyId: v.companyId,
    filename: v.filename,
    contentType: v.contentType,
    sizeBytes: v.sizeBytes,
    status: v.status,
    chunksTotal: v.chunksTotal,
    chunksEmbedded: v.chunksEmbedded,
    error: v.error ?? undefined,
    isActive: v.id === activeVersionId,
    uploadedBy: {
      id: v.uploader.id,
      username: v.uploader.username,
      displayName: v.uploader.displayName,
    },
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    readyAt: v.readyAt ?? undefined,
    supersededBy: v.supersededBy ?? undefined,
  };
}

const withUploader = (db: Db) =>
  db
    .select({ version: schema.guidelineVersions, uploader: schema.users })
    .from(schema.guidelineVersions)
    .innerJoin(schema.users, eq(schema.users.id, schema.guidelineVersions.createdBy));

/** Loads versions by id together with their uploader. */
export async function loadVersionsById(
  db: Db,
  ids: string[],
): Promise<Map<string, VersionWithUploader>> {
  const out = new Map<string, VersionWithUploader>();
  if (ids.length === 0) return out;
  const rows = await withUploader(db).where(inArray(schema.guidelineVersions.id, ids));
  for (const r of rows) out.set(r.version.id, { ...r.version, uploader: r.uploader });
  return out;
}

/** Latest version (highest seq) per company, keyed by company id. */
export async function loadLatestVersionsByCompany(
  db: Db,
  companyIds: string[],
): Promise<Map<string, VersionWithUploader>> {
  const out = new Map<string, VersionWithUploader>();
  if (companyIds.length === 0) return out;
  const latestSeq = db
    .select({
      companyId: schema.guidelineVersions.companyId,
      maxSeq: sql<number>`max(${schema.guidelineVersions.seq})`.as('max_seq'),
    })
    .from(schema.guidelineVersions)
    .where(inArray(schema.guidelineVersions.companyId, companyIds))
    .groupBy(schema.guidelineVersions.companyId)
    .as('latest');
  const rows = await db
    .select({ version: schema.guidelineVersions, uploader: schema.users })
    .from(schema.guidelineVersions)
    .innerJoin(latestSeq, eq(latestSeq.maxSeq, schema.guidelineVersions.seq))
    .innerJoin(schema.users, eq(schema.users.id, schema.guidelineVersions.createdBy))
    .orderBy(desc(schema.guidelineVersions.seq));
  for (const r of rows) out.set(r.version.companyId, { ...r.version, uploader: r.uploader });
  return out;
}

export async function loadVersionsForCompany(
  db: Db,
  companyId: string,
): Promise<VersionWithUploader[]> {
  const rows = await withUploader(db)
    .where(eq(schema.guidelineVersions.companyId, companyId))
    .orderBy(desc(schema.guidelineVersions.seq));
  return rows.map((r) => ({ ...r.version, uploader: r.uploader }));
}
