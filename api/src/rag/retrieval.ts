import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';

import { type Embedder } from './embeddings.js';
import { type Db, schema } from '../db/client.js';

export interface RetrievedChunk {
  chunkId: string;
  ordinal: number;
  title: string | null;
  content: string;
  score: number;
  /**
   * Set when the section was not found by the live query's vector ranking: through a matching
   * correction's original question, or through a distinctive keyword of the message.
   */
  via?: 'correction' | 'keyword';
}

export interface RetrievedCorrection {
  correctionId: string;
  rating: 'up' | 'down';
  queryText: string;
  whatWasWrong: string | null;
  correctedAnswer: string | null;
  score: number;
  /** Stored embedding of the original customer message (reused for correction-anchored retrieval). */
  queryEmbedding: number[] | null;
}

const toVectorLiteral = (v: number[]) => `[${v.join(',')}]`;

/** Top-k guideline sections of one version by cosine similarity, filtered by a minimum score. */
export async function retrieveChunks(
  db: Db,
  embedder: Embedder,
  args: { versionId: string; query: string; topK: number; minScore: number },
): Promise<RetrievedChunk[]> {
  return retrieveChunksByVector(db, { ...args, vector: await embedder.embedQuery(args.query) });
}

/** Same as retrieveChunks with an already computed query vector. */
export async function retrieveChunksByVector(
  db: Db,
  args: { versionId: string; vector: number[]; topK: number; minScore: number },
): Promise<RetrievedChunk[]> {
  const vec = toVectorLiteral(args.vector);
  const score = sql<number>`1 - (${schema.guidelineChunks.embedding} <=> ${vec}::vector)`;
  const rows = await db
    .select({
      chunkId: schema.guidelineChunks.id,
      ordinal: schema.guidelineChunks.ordinal,
      title: schema.guidelineChunks.title,
      content: schema.guidelineChunks.content,
      score,
    })
    .from(schema.guidelineChunks)
    .where(
      and(
        eq(schema.guidelineChunks.versionId, args.versionId),
        isNotNull(schema.guidelineChunks.embedding),
      ),
    )
    .orderBy(desc(score))
    .limit(args.topK);
  return rows
    .filter((r) => Number(r.score) >= args.minScore)
    .map((r) => ({ ...r, score: Number(r.score) }));
}

/**
 * Keyword rescue: one section the vector ranking missed but that contains a distinctive word of
 * the message. Short emotional messages ("Worst VPN ever, cancel everything") embed as "angry
 * customer", so every section scores alike and the one that matters (billing) can rank last; the
 * word "cancel" still identifies it. The vector ranking is never reordered: the rescued section is
 * appended, tagged `via: 'keyword'`, so the evaluated top-k behaviour is unchanged.
 *
 * Distinctive = a stemmed content word of the message (stop words removed by Postgres) that occurs
 * in at most a quarter of the version's sections, and at least twice in the candidate section: a
 * word a section uses repeatedly is one of its topics ("cancel" in billing), a single incidental
 * use is not ("could you tell me" in disconnections). Candidates are ranked by the number of such
 * words they contain, then by cosine similarity. Returns null when nothing qualifies.
 */
export async function retrieveKeywordRescue(
  db: Db,
  args: { versionId: string; query: string; vector: number[]; exclude: string[] },
): Promise<RetrievedChunk | null> {
  const vec = toVectorLiteral(args.vector);
  const excludeClause = args.exclude.length
    ? sql`AND c.id NOT IN (${sql.join(
        args.exclude.map((id) => sql`${id}::uuid`),
        sql`, `,
      )})`
    : sql``;
  const result = await db.execute(sql`
    WITH lexemes AS (
      SELECT DISTINCT unnest(tsvector_to_array(to_tsvector('english', ${args.query}))) AS lexeme
    ),
    version_chunks AS (
      SELECT id, ordinal, title, content, embedding, search_vector
      FROM guideline_chunks
      WHERE version_id = ${args.versionId}::uuid AND embedding IS NOT NULL
    ),
    rare AS (
      SELECT l.lexeme
      FROM lexemes l
      JOIN version_chunks c ON c.search_vector @@ plainto_tsquery('english', l.lexeme)
      GROUP BY l.lexeme
      HAVING count(*) = 1 OR count(*) * 4 <= (SELECT count(*) FROM version_chunks)
    )
    SELECT c.id AS "chunkId", c.ordinal, c.title, c.content,
           1 - (c.embedding <=> ${vec}::vector) AS score,
           count(r.lexeme) AS hits
    FROM version_chunks c
    JOIN rare r ON c.search_vector @@ plainto_tsquery('english', r.lexeme)
    JOIN LATERAL (
      SELECT max(array_length(u.positions, 1)) AS tf
      FROM unnest(c.search_vector) u WHERE u.lexeme = r.lexeme
    ) t ON t.tf >= 2
    WHERE true ${excludeClause}
    GROUP BY c.id, c.ordinal, c.title, c.content, c.embedding
    ORDER BY hits DESC, score DESC
    LIMIT 1
  `);
  const rows = (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [])) as {
    chunkId: string;
    ordinal: number;
    title: string | null;
    content: string;
    score: number | string;
  }[];
  const row = rows[0];
  if (!row) return null;
  return {
    chunkId: row.chunkId,
    ordinal: Number(row.ordinal),
    title: row.title,
    content: row.content,
    score: Number(row.score),
    via: 'keyword',
  };
}

/** Active corrections (agent feedback) of a company similar to the query. */
export async function retrieveCorrections(
  db: Db,
  embedder: Embedder,
  args: { companyId: string; query: string; topK: number; minScore: number },
): Promise<RetrievedCorrection[]> {
  if (args.topK <= 0) return [];
  const vec = toVectorLiteral(await embedder.embedQuery(args.query));
  const score = sql<number>`1 - (${schema.feedback.queryEmbedding} <=> ${vec}::vector)`;
  const rows = await db
    .select({
      correctionId: schema.feedback.id,
      rating: schema.feedback.rating,
      queryText: schema.feedback.queryText,
      whatWasWrong: schema.feedback.whatWasWrong,
      correctedAnswer: schema.feedback.correctedAnswer,
      queryEmbedding: schema.feedback.queryEmbedding,
      score,
    })
    .from(schema.feedback)
    .where(
      and(
        eq(schema.feedback.companyId, args.companyId),
        eq(schema.feedback.active, true),
        isNotNull(schema.feedback.queryEmbedding),
      ),
    )
    .orderBy(desc(score))
    .limit(args.topK);
  return rows
    .filter((r) => Number(r.score) >= args.minScore)
    .map((r) => ({ ...r, score: Number(r.score) }));
}

/**
 * Correction-anchored retrieval: a customer paraphrase can match a stored correction while its
 * wording misses the guideline section the original question retrieved (e.g. "payment bounced,
 * VPN stopped working" ranks connection sections above billing). The sections found through the
 * correction's original question are appended so the model can ground the corrected answer.
 */
export function mergeRetrieved(
  primary: RetrievedChunk[],
  viaCorrection: RetrievedChunk[],
  maxExtra: number,
): RetrievedChunk[] {
  const seen = new Set(primary.map((c) => c.chunkId));
  const extra: RetrievedChunk[] = [];
  for (const c of viaCorrection) {
    if (extra.length >= maxExtra) break;
    if (seen.has(c.chunkId)) continue;
    seen.add(c.chunkId);
    extra.push({ ...c, via: 'correction' });
  }
  return [...primary, ...extra];
}
