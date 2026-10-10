/**
 * Retrieval evaluation: for each labelled customer message, does the expected guideline section
 * rank first (for multi-topic messages: do all expected sections reach the prompt)? How well does
 * the similarity threshold separate in-scope from out-of-scope? Does the keyword rescue bring back
 * sections the vector ranking missed, and how often does it misfire?
 * Vector and hybrid rankings run in memory (chunker + real Gemini embeddings); the keyword rescue
 * runs the production SQL on an in-process PGlite database, at the production dimension only.
 *
 *   GEMINI_API_KEY=... pnpm --filter api eval:retrieval [--dims 768,1536] [--thresholds 0.45,0.5,...]
 *
 * Writes docs/evals/retrieval-results.json and docs/evals/retrieval-results.md.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { pino } from 'pino';
import { z } from 'zod';

import { loadDotEnv } from './load-env.js';
import { schema } from '../src/db/client.js';
import { EMBEDDING_DIMENSIONS } from '../src/db/schema.js';
import { chunkText, type Chunk } from '../src/ingestion/chunker.js';
import { createGeminiEmbedder } from '../src/rag/embeddings.js';
import { retrieveKeywordRescue } from '../src/rag/retrieval.js';
import { createTestDb } from '../test/helpers/test-db.js';

/** original = first labelled set; vague = short/emotional; manual = acceptance test plans; multi = two sections expected. */
const styles = ['original', 'manual', 'vague', 'multi'] as const;
type Style = (typeof styles)[number];

const datasetSchema = z.object({
  description: z.string(),
  companies: z.record(
    z.string(),
    z.object({
      file: z.string(),
      queries: z.array(
        z.object({
          text: z.string(),
          expected: z.union([z.string(), z.array(z.string()).min(1)]),
          style: z.enum(['vague', 'manual', 'multi']).optional(),
        }),
      ),
      outOfScope: z.array(z.string()),
    }),
  ),
});

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2)
  args.set(process.argv[i]!.replace(/^--/, ''), process.argv[i + 1] ?? '');
const dims = (args.get('dims') ?? '768,1536').split(',').map(Number);
const topK = Number(args.get('top-k') ?? '4'); // RAG_TOP_K: sections the model actually sees
const thresholds = (args.get('thresholds') ?? '0.5,0.55,0.58,0.6,0.62,0.65,0.7')
  .split(',')
  .map(Number);

loadDotEnv();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required (set it in .env or the environment)');
const model = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2';
const log = pino({ level: 'warn' });

const here = fileURLToPath(new URL('.', import.meta.url));
const dataset = datasetSchema.parse(
  JSON.parse(await readFile(new URL('./retrieval-dataset.json', import.meta.url), 'utf8')),
);

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);

/** Minimal BM25 (k1 = 1.2, b = 0.75) over lower-cased alphanumeric tokens; stands in for Postgres full-text search. */
function createBm25(docs: string[]) {
  const tokenize = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const tokens = docs.map(tokenize);
  const avgLen = tokens.reduce((s, d) => s + d.length, 0) / Math.max(1, tokens.length);
  const df = new Map<string, number>();
  for (const d of tokens) for (const term of new Set(d)) df.set(term, (df.get(term) ?? 0) + 1);
  const n = docs.length;
  return (query: string): number[] => {
    const q = new Set(tokenize(query));
    return tokens.map((d) => {
      const tf = new Map<string, number>();
      for (const term of d) tf.set(term, (tf.get(term) ?? 0) + 1);
      let score = 0;
      for (const term of q) {
        const f = tf.get(term);
        if (!f) continue;
        const idf = Math.log(1 + (n - (df.get(term) ?? 0) + 0.5) / ((df.get(term) ?? 0) + 0.5));
        score += (idf * (f * 2.2)) / (f + 1.2 * (1 - 0.75 + (0.75 * d.length) / avgLen));
      }
      return score;
    });
  };
}

/** Reciprocal-rank fusion (k = 60) of two rankings given as ordered index lists. */
function rrf(rankings: number[][], size: number): { index: number; rrf: number }[] {
  const scores = new Array<number>(size).fill(0);
  for (const ranking of rankings)
    ranking.forEach((index, rank) => {
      scores[index] = (scores[index] ?? 0) + 1 / (60 + rank);
    });
  return scores.map((s, index) => ({ index, rrf: s })).sort((a, b) => b.rrf - a.rrf);
}

/**
 * The production keyword rescue needs the real table (generated tsvector column, GIN index), so
 * the chunks and their vectors are loaded into an in-process PGlite migrated like production.
 */
async function createRescueFixture() {
  const { db, close } = await createTestDb();
  const [user] = await db
    .insert(schema.users)
    .values({ username: 'eval', passwordHash: 'n/a', displayName: 'Eval' })
    .returning({ id: schema.users.id });
  return {
    close,
    async loadCompany(name: string, fileBytes: Buffer, chunks: Chunk[], vectors: number[][]) {
      const [company] = await db
        .insert(schema.companies)
        .values({ name, createdBy: user!.id })
        .returning({ id: schema.companies.id });
      const [version] = await db
        .insert(schema.guidelineVersions)
        .values({
          companyId: company!.id,
          filename: `${name}.txt`,
          contentType: 'text/plain',
          sizeBytes: fileBytes.length,
          sha256: 'eval',
          fileBytes,
          status: 'ready',
          chunksTotal: chunks.length,
          chunksEmbedded: chunks.length,
          createdBy: user!.id,
        })
        .returning({ id: schema.guidelineVersions.id });
      const rows = await db
        .insert(schema.guidelineChunks)
        .values(
          chunks.map((c, i) => ({
            versionId: version!.id,
            companyId: company!.id,
            ordinal: c.ordinal,
            title: c.title,
            content: c.content,
            tokenCount: c.tokenCount,
            embedding: vectors[i]!,
          })),
        )
        .returning({ id: schema.guidelineChunks.id, ordinal: schema.guidelineChunks.ordinal });
      const idByOrdinal = new Map(rows.map((r) => [r.ordinal, r.id]));
      return {
        /** Runs the production rescue for a query whose vector top-k is `topIndexes` (chunk indexes). */
        rescue: (query: string, vector: number[], topIndexes: number[]) =>
          retrieveKeywordRescue(db, {
            versionId: version!.id,
            query,
            vector,
            exclude: topIndexes.map((i) => idByOrdinal.get(chunks[i]!.ordinal)!),
          }),
      };
    },
  };
}

interface QueryResult {
  company: string;
  text: string;
  /** Expected section(s), joined with " + " for display. */
  expected: string;
  expectedAll: string[];
  style: Style;
  ranked: { title: string; score: number }[];
  /** Score of the weakest expected section. */
  expectedScore: number;
  bestScore: number;
  /** The first-ranked section is an expected one. */
  top1: boolean;
  /** Every expected section is within the top 3 / top RAG_TOP_K (i.e. in the prompt). */
  top3: boolean;
  topK: boolean;
  /** weakest expected score minus best unexpected score (positive = well separated) */
  margin: number;
  /** Same query ranked by reciprocal-rank fusion of cosine and BM25 (hybrid retrieval experiment). */
  hybridRanked: { title: string; rrf: number }[];
  hybridTop1: boolean;
  hybridTop3: boolean;
  hybridTopK: boolean;
  /** Section appended by the production keyword rescue (null = did not fire; undefined = not evaluated at this dimension). */
  rescueTitle?: string | null;
  /** every expected section in the prompt once the rescue is applied (top-k or rescued) */
  rescueTopK?: boolean;
}
interface ProbeResult {
  company: string;
  text: string;
  best: { title: string; score: number };
  rescueTitle?: string | null;
}
interface StyleSummary {
  total: number;
  top1Accuracy: number;
  topKRecall: number;
  rescueTopKRecall: number | null;
}
interface DimResult {
  dims: number;
  queries: QueryResult[];
  probes: ProbeResult[];
  top1Accuracy: number;
  top3Recall: number;
  topKRecall: number;
  hybridTop1Accuracy: number;
  hybridTop3Recall: number;
  hybridTopKRecall: number;
  meanMargin: number;
  minMargin: number;
  byStyle: Record<Style, StyleSummary>;
  /** Keyword rescue, evaluated with the production SQL (only at the schema's dimension). */
  rescue: {
    topKRecall: number;
    /** queries where the rescue appended a section */
    fired: number;
    /** an expected section missed by vectors and brought back by the rescue */
    genuine: number;
    /** rescue fired although every expected section was already in the prompt (extra section, no harm to recall) */
    redundant: number;
    /** an expected section missed by vectors and the rescue appended a different one */
    wrong: number;
    /** out-of-scope probes where the rescue appended a section */
    probesFired: number;
  } | null;
  thresholds: {
    threshold: number;
    /** in-scope messages where the best section clears the gate (the server lets the model answer) */
    inScopePassGate: number;
    /** in-scope messages where every expected section clears the gate */
    inScopeExpectedKept: number;
    inScopeTotal: number;
    outOfScopeRejected: number;
    outOfScopeTotal: number;
  }[];
}

const results: DimResult[] = [];
for (const d of dims) {
  const embedder = createGeminiEmbedder({ apiKey, model, dimensions: d, log });
  const fixture = d === EMBEDDING_DIMENSIONS ? await createRescueFixture() : null;
  const queries: QueryResult[] = [];
  const probes: ProbeResult[] = [];
  for (const [company, spec] of Object.entries(dataset.companies)) {
    const fileBytes = await readFile(`${here}/../seed/guidelines/${spec.file}`);
    const chunks = chunkText(fileBytes.toString('utf8'));
    const vectors = await embedder.embedDocuments(
      chunks.map((c) => (c.title ? `${c.title}\n${c.content}` : c.content)),
    );
    const titles = chunks.map((c) => c.title ?? `#${c.ordinal}`);
    const bm25 = createBm25(chunks.map((c) => (c.title ? `${c.title}\n${c.content}` : c.content)));
    const loaded = fixture ? await fixture.loadCompany(company, fileBytes, chunks, vectors) : null;
    const rank = async (q: string) => {
      const qv = await embedder.embedQuery(q);
      const ranked = chunks
        .map((c, i) => ({ index: i, title: titles[i]!, score: dot(qv, vectors[i]!) }))
        .sort((a, b) => b.score - a.score);
      return { qv, ranked };
    };
    for (const q of spec.queries) {
      const expectedAll = Array.isArray(q.expected) ? q.expected : [q.expected];
      for (const e of expectedAll)
        if (!titles.includes(e)) throw new Error(`[${company}] unknown expected section "${e}"`);
      const isExpected = (title: string) => expectedAll.includes(title);
      const allIn = (top: { title: string }[]) =>
        expectedAll.every((e) => top.some((r) => r.title === e));
      const { qv, ranked } = await rank(q.text);
      const expectedScore = Math.min(
        ...expectedAll.map((e) => ranked.find((r) => r.title === e)?.score ?? 0),
      );
      const bestUnexpected = ranked.find((r) => !isExpected(r.title));
      const lexical = bm25(q.text)
        .map((score, index) => ({ index, score }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.index);
      const hybrid = rrf([ranked.map((r) => r.index), lexical], chunks.length).map((x) => ({
        title: titles[x.index]!,
        rrf: x.rrf,
      }));
      const inTopK = allIn(ranked.slice(0, topK));
      const rescued = loaded
        ? await loaded.rescue(
            q.text,
            qv,
            ranked.slice(0, topK).map((r) => r.index),
          )
        : undefined;
      queries.push({
        company,
        text: q.text,
        expected: expectedAll.join(' + '),
        expectedAll,
        style: expectedAll.length > 1 ? 'multi' : (q.style ?? 'original'),
        ranked: ranked.slice(0, 5).map(({ title, score }) => ({ title, score })),
        expectedScore,
        bestScore: ranked[0]?.score ?? 0,
        top1: isExpected(ranked[0]?.title ?? ''),
        top3: allIn(ranked.slice(0, 3)),
        topK: inTopK,
        margin: expectedScore - (bestUnexpected?.score ?? 0),
        hybridRanked: hybrid.slice(0, 5),
        hybridTop1: isExpected(hybrid[0]?.title ?? ''),
        hybridTop3: allIn(hybrid.slice(0, 3)),
        hybridTopK: allIn(hybrid.slice(0, topK)),
        ...(rescued !== undefined
          ? {
              rescueTitle: rescued?.title ?? null,
              rescueTopK: allIn([
                ...ranked.slice(0, topK),
                ...(rescued ? [{ title: rescued.title ?? '' }] : []),
              ]),
            }
          : {}),
      });
    }
    for (const p of spec.outOfScope) {
      const { qv, ranked } = await rank(p);
      const best = ranked[0]!;
      const rescued = loaded
        ? await loaded.rescue(
            p,
            qv,
            ranked.slice(0, topK).map((r) => r.index),
          )
        : undefined;
      probes.push({
        company,
        text: p,
        best: { title: best.title, score: best.score },
        ...(rescued !== undefined ? { rescueTitle: rescued?.title ?? null } : {}),
      });
    }
  }
  await fixture?.close();

  const ratio = (xs: QueryResult[], pred: (q: QueryResult) => boolean) =>
    xs.length ? xs.filter(pred).length / xs.length : 0;
  const summarise = (xs: QueryResult[]): StyleSummary => ({
    total: xs.length,
    top1Accuracy: ratio(xs, (q) => q.top1),
    topKRecall: ratio(xs, (q) => q.topK),
    rescueTopKRecall: fixture ? ratio(xs, (q) => q.rescueTopK === true) : null,
  });
  results.push({
    dims: d,
    queries,
    probes,
    top1Accuracy: ratio(queries, (q) => q.top1),
    top3Recall: ratio(queries, (q) => q.top3),
    topKRecall: ratio(queries, (q) => q.topK),
    hybridTop1Accuracy: ratio(queries, (q) => q.hybridTop1),
    hybridTop3Recall: ratio(queries, (q) => q.hybridTop3),
    hybridTopKRecall: ratio(queries, (q) => q.hybridTopK),
    meanMargin: queries.reduce((s, q) => s + q.margin, 0) / queries.length,
    minMargin: Math.min(...queries.map((q) => q.margin)),
    byStyle: Object.fromEntries(
      styles.map((s) => [s, summarise(queries.filter((q) => q.style === s))]),
    ) as Record<Style, StyleSummary>,
    rescue: fixture
      ? {
          topKRecall: ratio(queries, (q) => q.rescueTopK === true),
          fired: queries.filter((q) => q.rescueTitle).length,
          genuine: queries.filter((q) => !q.topK && q.rescueTopK).length,
          redundant: queries.filter((q) => q.topK && q.rescueTitle).length,
          wrong: queries.filter((q) => !q.topK && q.rescueTitle && !q.rescueTopK).length,
          probesFired: probes.filter((p) => p.rescueTitle).length,
        }
      : null,
    thresholds: thresholds.map((t) => ({
      threshold: t,
      inScopePassGate: queries.filter((q) => q.bestScore >= t).length,
      inScopeExpectedKept: queries.filter((q) => q.expectedScore >= t).length,
      inScopeTotal: queries.length,
      outOfScopeRejected: probes.filter((p) => p.best.score < t).length,
      outOfScopeTotal: probes.length,
    })),
  });
  const r = results.at(-1)!;
  console.warn(
    `dims=${d}: top1=${(r.top1Accuracy * 100).toFixed(1)}% top3=${(r.top3Recall * 100).toFixed(1)}% top${topK}=${(r.topKRecall * 100).toFixed(1)}% | hybrid top1=${(r.hybridTop1Accuracy * 100).toFixed(1)}% top3=${(r.hybridTop3Recall * 100).toFixed(1)}% top${topK}=${(r.hybridTopKRecall * 100).toFixed(1)}%${
      r.rescue
        ? ` | rescue top${topK}=${(r.rescue.topKRecall * 100).toFixed(1)}% fired=${r.rescue.fired} genuine=${r.rescue.genuine} redundant=${r.rescue.redundant} wrong=${r.rescue.wrong} probesFired=${r.rescue.probesFired}`
        : ''
    }`,
  );
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const pctOrNa = (n: number | null) => (n === null ? 'n/a' : pct(n));
const first = results[0]!;
const styleCounts = styles.map((s) => `${first.byStyle[s].total} ${s}`).join(', ');
const md: string[] = [
  '# Retrieval evaluation results',
  '',
  `Generated ${new Date().toISOString()} with model \`${model}\`, chunker defaults, cosine similarity on unit vectors.`,
  '',
  `Dataset: ${first.queries.length} labelled in-scope messages (${styleCounts}) and ${first.probes.length} out-of-scope probes across ${Object.keys(dataset.companies).length} companies. Styles: original = the first labelled set; manual = the acceptance test plans; vague = short, emotional or underspecified messages; multi = messages spanning two sections, counted as recalled only when both reach the prompt.`,
  '',
  '## Ranking quality',
  '',
  `| Dimensions | Top-1 accuracy | Top-3 recall | Top-${topK} recall (in prompt) | Mean margin | Min margin | Hybrid top-1 | Hybrid top-3 | Hybrid top-${topK} | Top-${topK} + keyword rescue |`,
  '|---|---|---|---|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.dims} | ${pct(r.top1Accuracy)} | ${pct(r.top3Recall)} | ${pct(r.topKRecall)} | ${r.meanMargin.toFixed(3)} | ${r.minMargin.toFixed(3)} | ${pct(r.hybridTop1Accuracy)} | ${pct(r.hybridTop3Recall)} | ${pct(r.hybridTopKRecall)} | ${r.rescue ? pct(r.rescue.topKRecall) : 'n/a'} |`,
  ),
  '',
  `Top-${topK} recall is the metric that matters in production: RAG_TOP_K sections go into the prompt, so the model sees the expected section whenever it is in the top ${topK}. `,
  'Margin = similarity of the (weakest) expected section minus the best other section; higher means the ranking is more robust. Hybrid = reciprocal-rank fusion (k = 60) of the cosine ranking and an in-memory BM25 ranking over the same chunks, i.e. what a Postgres full-text + pgvector hybrid would do. Keyword rescue = the production query (Postgres full-text, English stemming) that appends one section containing a distinctive, repeated word of the message when the vector top-k missed it; it never reorders the vector ranking, so top-1 is unchanged by construction.',
  '',
  '## By query style',
  '',
  ...results.flatMap((r) => [
    `### ${r.dims} dimensions`,
    '',
    `| Style | Queries | Top-1 accuracy | Top-${topK} recall | Top-${topK} + keyword rescue |`,
    '|---|---|---|---|---|',
    ...styles.map(
      (s) =>
        `| ${s} | ${r.byStyle[s].total} | ${pct(r.byStyle[s].top1Accuracy)} | ${pct(r.byStyle[s].topKRecall)} | ${pctOrNa(r.byStyle[s].rescueTopKRecall)} |`,
    ),
    '',
  ]),
  '## Keyword rescue',
  '',
  ...results.flatMap((r) =>
    r.rescue
      ? [
          `### ${r.dims} dimensions`,
          '',
          `Fired on ${r.rescue.fired}/${r.queries.length} in-scope messages: ${r.rescue.genuine} genuine (an expected section missed by vectors, brought back), ${r.rescue.redundant} redundant (expected sections already in the prompt; one extra section), ${r.rescue.wrong} wrong (an expected section missed and a different one appended). Fired on ${r.rescue.probesFired}/${r.probes.length} out-of-scope probes.`,
          '',
          ...(r.queries.filter((q) => !q.topK && q.rescueTopK).length
            ? [
                'Genuine rescues:',
                '',
                ...r.queries
                  .filter((q) => !q.topK && q.rescueTopK)
                  .map((q) => `- [${q.company}] "${q.text}" → **${q.rescueTitle}**`),
                '',
              ]
            : []),
          ...(r.queries.filter((q) => q.rescueTitle && !(q.rescueTopK && !q.topK)).length
            ? [
                'Rescue appended a section that was not needed or not the missing one:',
                '',
                ...r.queries
                  .filter((q) => q.rescueTitle && !(q.rescueTopK && !q.topK))
                  .map(
                    (q) =>
                      `- [${q.company}] "${q.text}" → appended **${q.rescueTitle}** (expected ${q.expected} ${q.topK ? 'already in prompt' : 'STILL MISSING'})`,
                  ),
                '',
              ]
            : []),
          ...(r.probes.filter((p) => p.rescueTitle).length
            ? [
                'Out-of-scope probes where the rescue fired:',
                '',
                ...r.probes
                  .filter((p) => p.rescueTitle)
                  .map((p) => `- [${p.company}] "${p.text}" → ${p.rescueTitle}`),
                '',
              ]
            : ['The rescue did not fire on any out-of-scope probe.', '']),
        ]
      : [`### ${r.dims} dimensions`, '', 'Not evaluated (schema column is vector(768)).', ''],
  ),
  '## Coverage gate (RAG_MIN_SCORE)',
  '',
  'Pass gate = in-scope messages where at least one section clears the threshold, i.e. the server lets the model answer (should be all). Expected kept = every expected section itself clears it. Out-of-scope rejected = probes whose best section scores below the threshold (should be all).',
  '',
  ...results.flatMap((r) => [
    `### ${r.dims} dimensions`,
    '',
    '| Threshold | In-scope pass gate | Expected section kept | Out-of-scope rejected |',
    '|---|---|---|---|',
    ...r.thresholds.map(
      (t) =>
        `| ${t.threshold} | ${t.inScopePassGate}/${t.inScopeTotal} | ${t.inScopeExpectedKept}/${t.inScopeTotal} | ${t.outOfScopeRejected}/${t.outOfScopeTotal} |`,
    ),
    '',
  ]),
  '## Misses and closest calls',
  '',
  ...results.flatMap((r) => [
    `### ${r.dims} dimensions`,
    '',
    ...(r.queries.filter((q) => !q.top1).length
      ? [
          'Top-1 misses:',
          '',
          ...r.queries
            .filter((q) => !q.top1)
            .map(
              (q) =>
                `- [${q.company}, ${q.style}] "${q.text}" → expected **${q.expected}**, got **${q.ranked[0]?.title}** (${q.ranked[0]?.score.toFixed(3)})`,
            ),
          '',
        ]
      : ['No top-1 misses.', '']),
    'Smallest margins:',
    '',
    ...[...r.queries]
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 5)
      .map(
        (q) =>
          `- ${q.margin.toFixed(3)} [${q.company}] "${q.text}" (${q.expected} ${q.expectedScore.toFixed(3)} vs ${q.ranked.find((x) => !q.expectedAll.includes(x.title))?.title} ${q.ranked.find((x) => !q.expectedAll.includes(x.title))?.score.toFixed(3)})`,
      ),
    '',
    ...(r.queries.filter((q) => !q.topK || !q.hybridTopK).length
      ? [
          `Expected section outside the top ${topK} (not in the prompt):`,
          '',
          ...r.queries
            .filter((q) => !q.topK || !q.hybridTopK)
            .map(
              (q) =>
                `- [${q.company}, ${q.style}] "${q.text}" → **${q.expected}**: vector ${q.topK ? 'in' : 'OUT'}, hybrid ${q.hybridTopK ? 'in' : 'OUT'}${q.rescueTopK !== undefined ? `, vector + keyword rescue ${q.rescueTopK ? 'in' : 'OUT'}` : ''}`,
            ),
          '',
        ]
      : [`Every expected section is within the top ${topK} for both rankings.`, '']),
    ...(r.queries.filter((q) => q.top1 !== q.hybridTop1).length
      ? [
          'Where hybrid ranking differs from vector-only (top-1):',
          '',
          ...r.queries
            .filter((q) => q.top1 !== q.hybridTop1)
            .map(
              (q) =>
                `- [${q.company}] "${q.text}" → vector **${q.ranked[0]?.title}** (${q.top1 ? 'hit' : 'miss'}), hybrid **${q.hybridRanked[0]?.title}** (${q.hybridTop1 ? 'hit' : 'miss'})`,
            ),
          '',
        ]
      : ['Hybrid ranking agrees with vector-only on every top-1 result.', '']),
    'Out-of-scope probes, best section score:',
    '',
    ...r.probes.map(
      (p) => `- ${p.best.score.toFixed(3)} [${p.company}] "${p.text}" → ${p.best.title}`,
    ),
    '',
  ]),
];

const outDir = new URL('../../docs/evals/', import.meta.url);
await writeFile(
  new URL('retrieval-results.json', outDir),
  JSON.stringify({ model, generatedAt: new Date().toISOString(), results }, null, 2),
);
await writeFile(new URL('retrieval-results.md', outDir), md.join('\n'));
console.warn('wrote docs/evals/retrieval-results.{json,md}');
