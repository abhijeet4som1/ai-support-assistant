/**
 * Minimal job-queue abstraction (two methods). Production uses pg-boss on the existing
 * Postgres; tests use the in-memory implementation. An SQS adapter would implement the
 * same interface for a cloud deployment.
 */
import PgBoss from 'pg-boss';
import { type Logger } from 'pino';

export interface EnqueueOptions {
  /** Only one active job per key (e.g. a version id) – duplicates are dropped. */
  singletonKey?: string;
  retryLimit?: number;
}

export type JobHandler<T> = (payload: T, jobId: string) => Promise<void>;

export interface JobQueue {
  enqueue<T extends object>(
    name: string,
    payload: T,
    opts?: EnqueueOptions,
  ): Promise<string | null>;
  subscribe<T extends object>(name: string, handler: JobHandler<T>): Promise<void>;
  stop(): Promise<void>;
}

export const QUEUES = { ingestGuidelines: 'ingest-guidelines' } as const;

export async function createPgBossQueue(connectionString: string, log: Logger): Promise<JobQueue> {
  const boss = new PgBoss({
    connectionString,
    schema: 'pgboss',
    application_name: 'ai-support-assistant',
  });
  boss.on('error', (err) => log.error({ err }, 'pg-boss error'));
  await boss.start();
  const created = new Set<string>();
  const ensureQueue = async (name: string) => {
    if (created.has(name)) return;
    await boss.createQueue(name);
    created.add(name);
  };
  return {
    async enqueue(name, payload, opts) {
      await ensureQueue(name);
      return boss.send(name, payload, {
        singletonKey: opts?.singletonKey,
        retryLimit: opts?.retryLimit ?? 5,
        retryDelay: 5,
        retryBackoff: true,
        expireInMinutes: 30,
      });
    },
    async subscribe<T extends object>(name: string, handler: JobHandler<T>) {
      await ensureQueue(name);
      await boss.work<T>(name, { batchSize: 1 }, async (jobs) => {
        for (const job of jobs) await handler(job.data, job.id);
      });
      log.info({ queue: name }, 'subscribed');
    },
    stop: () => boss.stop({ graceful: true, timeout: 10_000 }),
  };
}

/** In-process queue for tests: jobs run when `drain()` is called (deterministic). */
export function createInMemoryQueue() {
  const handlers = new Map<string, JobHandler<object>>();
  const pending: { name: string; payload: object; id: string; key?: string }[] = [];
  let seq = 0;
  const queue: JobQueue & { drain(): Promise<void>; pending: typeof pending } = {
    enqueue(name, payload, opts) {
      if (
        opts?.singletonKey &&
        pending.some((p) => p.name === name && p.key === opts.singletonKey)
      ) {
        return Promise.resolve(null);
      }
      const id = `job-${++seq}`;
      pending.push({ name, payload, id, key: opts?.singletonKey });
      return Promise.resolve(id);
    },
    subscribe(name, handler) {
      // A heterogeneous handler map cannot keep each queue's payload type; the enqueue side is typed.
      handlers.set(name, handler as JobHandler<object>);
      return Promise.resolve();
    },
    stop: () => Promise.resolve(),
    async drain() {
      while (pending.length) {
        const job = pending.shift()!;
        const handler = handlers.get(job.name);
        if (!handler) throw new Error(`no handler for queue ${job.name}`);
        await handler(job.payload, job.id);
      }
    },
    pending,
  };
  return queue;
}
