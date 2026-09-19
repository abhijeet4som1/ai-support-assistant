import { createHash } from 'node:crypto';

import {
  ConflictError,
  GuidelinesConflictError,
  GuidelinesNotReadyError,
  NotFoundError,
  PayloadTooLargeError,
  type GuidelineChunk,
  type GuidelineVersionSummary,
} from '@app/api-server-sdk';
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';

import { loadVersionsById, loadVersionsForCompany, toVersionSummary } from './mappers.js';
import { type Db, schema } from '../db/client.js';
import { detectFileKind } from '../ingestion/parsers.js';
import { QUEUES, type JobQueue } from '../jobs/queue.js';

export interface UploadInput {
  companyId: string;
  filename: string;
  fileContentType?: string;
  expectedVersionId?: string;
  body: Uint8Array;
  userId: string;
}

export interface GuidelinesService {
  upload(input: UploadInput): Promise<{ version: GuidelineVersionSummary; created: boolean }>;
  getActive(
    companyId: string,
  ): Promise<{ version: GuidelineVersionSummary; text: string; chunks: GuidelineChunk[] }>;
  listVersions(companyId: string): Promise<GuidelineVersionSummary[]>;
  getVersion(versionId: string): Promise<GuidelineVersionSummary>;
  retry(versionId: string): Promise<GuidelineVersionSummary>;
  activate(versionId: string): Promise<GuidelineVersionSummary>;
}

const IN_FLIGHT = ['queued', 'parsing', 'chunking', 'embedding'] as const;

export function createGuidelinesService(
  db: Db,
  queue: JobQueue,
  opts: { maxUploadBytes: number },
): GuidelinesService {
  async function requireCompany(companyId: string) {
    const c = await db.query.companies.findFirst({ where: eq(schema.companies.id, companyId) });
    if (!c)
      throw new NotFoundError({ message: 'Company not found', resource: 'company', id: companyId });
    return c;
  }

  async function summary(versionId: string): Promise<GuidelineVersionSummary> {
    const v = (await loadVersionsById(db, [versionId])).get(versionId);
    if (!v)
      throw new NotFoundError({
        message: 'Guideline version not found',
        resource: 'guidelineVersion',
        id: versionId,
      });
    const company = await requireCompany(v.companyId);
    return toVersionSummary(v, company.activeGuidelineVersionId);
  }

  return {
    async upload(input) {
      if (input.body.byteLength > opts.maxUploadBytes) {
        throw new PayloadTooLargeError({
          message: `File is larger than the ${Math.round(opts.maxUploadBytes / 1024 / 1024)} MB limit`,
          maxBytes: opts.maxUploadBytes,
        });
      }
      if (input.body.byteLength === 0) {
        throw new PayloadTooLargeError({
          message: 'The uploaded file is empty',
          maxBytes: opts.maxUploadBytes,
        });
      }
      const detected = detectFileKind(input.filename, input.body, input.fileContentType);
      const sha256 = createHash('sha256').update(input.body).digest('hex');

      const result = await db.transaction(async (tx) => {
        // Serialise uploads per company so two agents cannot race on "latest".
        const [company] = await tx
          .select()
          .from(schema.companies)
          .where(eq(schema.companies.id, input.companyId))
          .for('update');
        if (!company)
          throw new NotFoundError({
            message: 'Company not found',
            resource: 'company',
            id: input.companyId,
          });

        const [latest] = await tx
          .select()
          .from(schema.guidelineVersions)
          .where(eq(schema.guidelineVersions.companyId, input.companyId))
          .orderBy(sql`${schema.guidelineVersions.seq} desc`)
          .limit(1);

        if (input.expectedVersionId && latest && latest.id !== input.expectedVersionId) {
          const uploader = await tx.query.users.findFirst({
            where: eq(schema.users.id, latest.createdBy),
          });
          throw new GuidelinesConflictError({
            message: `${uploader?.displayName ?? 'Another user'} uploaded new guidelines after you opened this page`,
            latestVersionId: latest.id,
            uploadedBy: {
              id: uploader!.id,
              username: uploader!.username,
              displayName: uploader!.displayName,
            },
            uploadedAt: latest.createdAt,
          });
        }

        // Same file as the active version: nothing to do.
        if (
          company.activeGuidelineVersionId &&
          latest?.id === company.activeGuidelineVersionId &&
          latest.sha256 === sha256
        ) {
          return { versionId: latest.id, created: false };
        }

        await tx
          .update(schema.guidelineVersions)
          .set({ status: 'superseded' })
          .where(
            and(
              eq(schema.guidelineVersions.companyId, input.companyId),
              inArray(schema.guidelineVersions.status, [...IN_FLIGHT]),
            ),
          );

        const [version] = await tx
          .insert(schema.guidelineVersions)
          .values({
            companyId: input.companyId,
            filename: input.filename,
            contentType: detected.contentType,
            sizeBytes: input.body.byteLength,
            sha256,
            fileBytes: Buffer.from(input.body),
            status: 'queued',
            createdBy: input.userId,
          })
          .returning({ id: schema.guidelineVersions.id });

        // Point superseded versions at their successor (informational).
        await tx
          .update(schema.guidelineVersions)
          .set({ supersededBy: version!.id })
          .where(
            and(
              eq(schema.guidelineVersions.companyId, input.companyId),
              eq(schema.guidelineVersions.status, 'superseded'),
              sql`${schema.guidelineVersions.supersededBy} is null`,
            ),
          );
        return { versionId: version!.id, created: true };
      });

      if (result.created) {
        const jobId = await queue.enqueue(
          QUEUES.ingestGuidelines,
          { versionId: result.versionId },
          { singletonKey: result.versionId },
        );
        if (jobId)
          await db
            .update(schema.guidelineVersions)
            .set({ jobId })
            .where(eq(schema.guidelineVersions.id, result.versionId));
      }
      return { version: await summary(result.versionId), created: result.created };
    },

    async getActive(companyId) {
      const company = await requireCompany(companyId);
      if (!company.activeGuidelineVersionId) {
        const [latest] = await db
          .select({ status: schema.guidelineVersions.status })
          .from(schema.guidelineVersions)
          .where(eq(schema.guidelineVersions.companyId, companyId))
          .orderBy(sql`${schema.guidelineVersions.seq} desc`)
          .limit(1);
        throw new GuidelinesNotReadyError({
          message: latest
            ? 'Guidelines are still being processed'
            : 'No guidelines have been uploaded for this company yet',
          companyId,
          latestStatus: latest?.status,
        });
      }
      const v = (await loadVersionsById(db, [company.activeGuidelineVersionId])).get(
        company.activeGuidelineVersionId,
      )!;
      const chunks = await db
        .select()
        .from(schema.guidelineChunks)
        .where(eq(schema.guidelineChunks.versionId, v.id))
        .orderBy(asc(schema.guidelineChunks.ordinal));
      return {
        version: toVersionSummary(v, company.activeGuidelineVersionId),
        text: v.rawText ?? '',
        chunks: chunks.map((c) => ({
          id: c.id,
          ordinal: c.ordinal,
          title: c.title ?? undefined,
          content: c.content,
          tokenCount: c.tokenCount,
        })),
      };
    },

    async listVersions(companyId) {
      const company = await requireCompany(companyId);
      const versions = await loadVersionsForCompany(db, companyId);
      return versions.map((v) => toVersionSummary(v, company.activeGuidelineVersionId));
    },

    getVersion: (versionId) => summary(versionId),

    async retry(versionId) {
      const v = await db.query.guidelineVersions.findFirst({
        where: eq(schema.guidelineVersions.id, versionId),
      });
      if (!v)
        throw new NotFoundError({
          message: 'Guideline version not found',
          resource: 'guidelineVersion',
          id: versionId,
        });
      if (v.status !== 'failed') {
        throw new ConflictError({
          message: `Only failed versions can be retried (status is "${v.status}")`,
        });
      }
      await db
        .update(schema.guidelineVersions)
        .set({ status: 'queued', error: null, chunksEmbedded: 0 })
        .where(eq(schema.guidelineVersions.id, versionId));
      const jobId = await queue.enqueue(
        QUEUES.ingestGuidelines,
        { versionId },
        { singletonKey: `${versionId}:${Date.now()}` },
      );
      if (jobId)
        await db
          .update(schema.guidelineVersions)
          .set({ jobId })
          .where(eq(schema.guidelineVersions.id, versionId));
      return summary(versionId);
    },

    async activate(versionId) {
      const v = await db.query.guidelineVersions.findFirst({
        where: eq(schema.guidelineVersions.id, versionId),
      });
      if (!v)
        throw new NotFoundError({
          message: 'Guideline version not found',
          resource: 'guidelineVersion',
          id: versionId,
        });
      if (v.status !== 'ready') {
        throw new ConflictError({
          message: `Only ready versions can be activated (status is "${v.status}")`,
        });
      }
      await setActiveVersion(db, v.companyId, versionId, { force: true });
      return summary(versionId);
    },
  };
}

/**
 * Makes `versionId` the active version of its company and deactivates corrections written
 * against other versions. With `force: false` an older version never overwrites a newer active
 * one (a slow job finishing late).
 */
export async function setActiveVersion(
  db: Db,
  companyId: string,
  versionId: string,
  opts: { force: boolean },
) {
  await db.transaction(async (tx) => {
    const [company] = await tx
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, companyId))
      .for('update');
    if (!company) return;
    if (!opts.force && company.activeGuidelineVersionId) {
      const [[current], [next]] = await Promise.all([
        tx
          .select({ seq: schema.guidelineVersions.seq })
          .from(schema.guidelineVersions)
          .where(eq(schema.guidelineVersions.id, company.activeGuidelineVersionId)),
        tx
          .select({ seq: schema.guidelineVersions.seq })
          .from(schema.guidelineVersions)
          .where(eq(schema.guidelineVersions.id, versionId)),
      ]);
      if (current && next && next.seq < current.seq) return;
    }
    await tx
      .update(schema.companies)
      .set({ activeGuidelineVersionId: versionId })
      .where(eq(schema.companies.id, companyId));
    await tx
      .update(schema.feedback)
      .set({ active: false })
      .where(
        and(
          eq(schema.feedback.companyId, companyId),
          ne(schema.feedback.guidelineVersionId, versionId),
          eq(schema.feedback.active, true),
        ),
      );
  });
}
