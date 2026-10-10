/**
 * Correction-quality evaluation. For each case:
 *   1. Ingest the company guidelines into an in-process PGlite database (real Gemini embeddings).
 *   2. Answer a similar customer message WITHOUT any correction stored (baseline).
 *   3. Store the agent's thumbs-down correction for the original message.
 *   4. Answer the similar message again WITH the correction retrievable.
 *   5. Ask Gemini, as a judge, to score both answers 1-5 for closeness to the corrected answer.
 *
 *   GEMINI_API_KEY=... pnpm --filter api eval:corrections
 *
 * Writes docs/evals/corrections-results.json and docs/evals/corrections-results.md.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { GoogleGenAI, Type } from '@google/genai';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { pino } from 'pino';
import { z } from 'zod';

import { loadDotEnv } from './load-env.js';
import { seedUsers } from '../src/auth/users.js';
import { loadConfig } from '../src/config.js';
import { createConversationsService } from '../src/conversations/service.js';
import { type Db, schema } from '../src/db/client.js';
import { migrationsFolder } from '../src/db/migrate.js';
import { createFeedbackService } from '../src/feedback/service.js';
import { createGuidelinesService } from '../src/guidelines/service.js';
import { createIngestionJob, type IngestPayload } from '../src/ingestion/job.js';
import { createInMemoryQueue, QUEUES } from '../src/jobs/queue.js';
import { createNoopTracer } from '../src/observability/tracer.js';
import { createGeminiEmbedder } from '../src/rag/embeddings.js';
import { createGeminiChatModel } from '../src/rag/llm.js';

/** Generated output types mark required members optional; evals fail loudly if one is missing. */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

const datasetSchema = z.object({
  description: z.string(),
  cases: z.array(
    z.object({
      company: z.string(),
      file: z.string(),
      message: z.string(),
      whatWasWrong: z.string(),
      correctedAnswer: z.string(),
      similarMessage: z.string(),
    }),
  ),
});

const repeatsArg = process.argv.indexOf('--repeats');
const repeats = repeatsArg === -1 ? 1 : Math.max(1, Number(process.argv[repeatsArg + 1]));

loadDotEnv();
const config = loadConfig({
  ...process.env,
  DATABASE_URL: 'postgres://unused',
  JWT_SECRET: 'eval-secret-0123456789',
});
const log = pino({ level: 'warn' });
const dataset = datasetSchema.parse(
  JSON.parse(await readFile(new URL('./corrections-dataset.json', import.meta.url), 'utf8')),
);
const here = fileURLToPath(new URL('.', import.meta.url));

const embedder = createGeminiEmbedder({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_EMBEDDING_MODEL,
  dimensions: config.GEMINI_EMBEDDING_DIMENSIONS,
  log,
});
const chatModel = createGeminiChatModel({
  apiKey: config.GEMINI_API_KEY,
  model: config.GEMINI_CHAT_MODEL,
  thinkingLevel: config.GEMINI_THINKING_LEVEL,
  log,
});
const judge = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
/** Judge model; pin it (EVAL_JUDGE_MODEL) when comparing chat models so a candidate does not grade itself. */
const judgeModel = process.env.EVAL_JUDGE_MODEL ?? config.GEMINI_CHAT_MODEL;

async function judgeAnswer(customer: string, target: string, candidate: string) {
  const res = await judge.models.generateContent({
    model: judgeModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'You grade customer-support replies. Compare the CANDIDATE reply with the REFERENCE reply a senior agent wrote for the same kind of request.',
              'Score 1-5: 5 = same steps, commitments and tone; 3 = right direction but missing a key step or commitment; 1 = contradicts or ignores the reference.',
              `CUSTOMER MESSAGE:\n${customer}\n\nREFERENCE:\n${target}\n\nCANDIDATE:\n${candidate}`,
            ].join('\n\n'),
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { score: { type: Type.INTEGER }, reason: { type: Type.STRING } },
        required: ['score', 'reason'],
      },
      temperature: 0,
    },
  });
  return z
    .object({ score: z.number().int().min(1).max(5), reason: z.string() })
    .parse(JSON.parse(res.text ?? '{}'));
}

interface ArmResult {
  /** first sample's reply, shown in the report */
  reply: string;
  /** mean judge score over the samples */
  score: number;
  scores: number[];
  reason: string;
  correctionsUsed: number;
}
interface CaseResult {
  company: string;
  similarMessage: string;
  baseline: ArmResult;
  withCorrection: ArmResult;
}

const results: CaseResult[] = [];
for (const c of dataset.cases) {
  const client = new PGlite({ extensions: { vector } });
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(drizzle(client, { schema }), { migrationsFolder });
  await seedUsers(db, 'agent1:agent1pass');
  const user = (await db.query.users.findFirst())!;
  const queue = createInMemoryQueue();
  await queue.subscribe<IngestPayload>(
    QUEUES.ingestGuidelines,
    createIngestionJob({ db, embedder, log, embedBatchSize: 50 }),
  );
  const guidelines = createGuidelinesService(db, queue, { maxUploadBytes: 10 * 1024 * 1024 });
  const feedback = createFeedbackService(db, embedder);
  const conversations = createConversationsService({
    db,
    embedder,
    chatModel,
    config,
    log,
    tracer: createNoopTracer(),
  });

  const [company] = await db
    .insert(schema.companies)
    .values({ name: c.company, createdBy: user.id })
    .returning();
  await guidelines.upload({
    companyId: company!.id,
    filename: c.file,
    body: new Uint8Array(await readFile(`${here}/../seed/guidelines/${c.file}`)),
    userId: user.id,
  });
  await queue.drain();

  const ask = async (text: string) => {
    const conv = await conversations.create(company!.id, user.id);
    const conversationId = required(required(conv.summary, 'summary').id, 'conversation id');
    let assistantMessage = (
      await conversations.sendMessage({
        conversationId,
        kind: 'customer',
        content: text,
        userId: user.id,
      })
    ).assistantMessage;
    // Provider hiccups (rate limits, transient 5xx) would otherwise skew the comparison: retry like an agent would.
    for (let attempt = 1; assistantMessage.status === 'failed' && attempt <= 3; attempt++) {
      console.warn(`  answer failed (${assistantMessage.error ?? 'unknown'}), retry ${attempt}/3`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      assistantMessage = (
        await conversations.sendMessage({
          conversationId,
          kind: 'customer',
          content: text,
          userId: user.id,
        })
      ).assistantMessage;
    }
    if (assistantMessage.status === 'failed')
      throw new Error(`answer failed after retries: ${assistantMessage.error ?? 'unknown'}`);
    return {
      id: required(assistantMessage.id, 'message id'),
      content: assistantMessage.content ?? '',
      correctionsUsed: assistantMessage.correctionsUsed ?? [],
    };
  };

  // Baseline: answer the similar message N times with no corrections stored (temperature 0.3 is
  // noisy, so a single sample per arm would over- or under-state the effect).
  const baselines: Awaited<ReturnType<typeof ask>>[] = [];
  for (let i = 0; i < repeats; i++) baselines.push(await ask(c.similarMessage));
  // Store the correction against an answer to the original message.
  const original = await ask(c.message);
  await feedback.submit({
    messageId: original.id,
    rating: 'down',
    whatWasWrong: c.whatWasWrong,
    correctedAnswer: c.correctedAnswer,
    userId: user.id,
  });
  // Answer the similar message again; the correction should now be retrieved.
  const improved: Awaited<ReturnType<typeof ask>>[] = [];
  for (let i = 0; i < repeats; i++) improved.push(await ask(c.similarMessage));

  const judged = async (answers: typeof baselines) => {
    const verdicts: Awaited<ReturnType<typeof judgeAnswer>>[] = [];
    for (const a of answers)
      verdicts.push(await judgeAnswer(c.similarMessage, c.correctedAnswer, a.content));
    return verdicts;
  };
  const [bj, wj] = [await judged(baselines), await judged(improved)];
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const b = {
    score: mean(bj.map((v) => v.score)),
    scores: bj.map((v) => v.score),
    reason: bj[0]!.reason,
  };
  const w = {
    score: mean(wj.map((v) => v.score)),
    scores: wj.map((v) => v.score),
    reason: wj[0]!.reason,
  };
  results.push({
    company: c.company,
    similarMessage: c.similarMessage,
    baseline: {
      reply: baselines[0]!.content,
      ...b,
      correctionsUsed: baselines[0]!.correctionsUsed.length,
    },
    withCorrection: {
      reply: improved[0]!.content,
      ...w,
      correctionsUsed: Math.min(...improved.map((a) => a.correctionsUsed.length)),
    },
  });
  console.warn(
    `[${c.company}] baseline ${b.score.toFixed(2)} → with correction ${w.score.toFixed(2)} (corrections retrieved: ${Math.min(...improved.map((a) => a.correctionsUsed.length))})`,
  );
  await client.close();
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const md = [
  '# Correction-quality evaluation results',
  '',
  `Generated ${new Date().toISOString()} with chat model \`${config.GEMINI_CHAT_MODEL}\`, embeddings \`${config.GEMINI_EMBEDDING_MODEL}\` (${config.GEMINI_EMBEDDING_DIMENSIONS}d), RAG_CORRECTIONS_MIN_SCORE = ${config.RAG_CORRECTIONS_MIN_SCORE}, ${repeats} sample(s) per arm, thinking \`${config.GEMINI_THINKING_LEVEL}\`, judge = \`${judgeModel}\` at temperature 0. Scores are judge means over the samples (individual samples in brackets).`,
  '',
  '| Case | Corrections retrieved | Baseline score | With correction |',
  '|---|---|---|---|',
  ...results.map(
    (r) =>
      `| [${r.company}] ${r.similarMessage} | ${r.withCorrection.correctionsUsed} | ${r.baseline.score.toFixed(2)} [${r.baseline.scores.join(', ')}] | ${r.withCorrection.score.toFixed(2)} [${r.withCorrection.scores.join(', ')}] |`,
  ),
  `| **Average** | | **${avg(results.map((r) => r.baseline.score)).toFixed(2)}** | **${avg(results.map((r) => r.withCorrection.score)).toFixed(2)}** |`,
  '',
  '## Details',
  '',
  ...results.flatMap((r) => [
    `### [${r.company}] ${r.similarMessage}`,
    '',
    `**Baseline (${r.baseline.score.toFixed(2)}/5)** — ${r.baseline.reason}`,
    '',
    `> ${r.baseline.reply.replace(/\n/g, '\n> ')}`,
    '',
    `**With correction (${r.withCorrection.score.toFixed(2)}/5)** — ${r.withCorrection.reason}`,
    '',
    `> ${r.withCorrection.reply.replace(/\n/g, '\n> ')}`,
    '',
  ]),
];
const outDir = new URL('../../docs/evals/', import.meta.url);
await writeFile(
  new URL('corrections-results.json', outDir),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
);
await writeFile(new URL('corrections-results.md', outDir), md.join('\n'));
console.warn('wrote docs/evals/corrections-results.{json,md}');
