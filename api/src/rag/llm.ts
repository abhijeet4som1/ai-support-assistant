import { FinishReason, GoogleGenAI } from '@google/genai';
import { type Logger } from 'pino';

import { guidanceResponseSchema } from './guidance.js';
import { type ChatTurn } from './prompt.js';
import { errorStatus, providerErrorMessage } from '../lib/unknown.js';

export interface GenerateResult {
  raw: string;
  promptTokens?: number;
  completionTokens?: number;
  /** Provider finish reason (STOP, MAX_TOKENS, SAFETY, ...) for diagnostics. */
  finishReason?: string;
}

export interface ChatModel {
  readonly model: string;
  generateGuidance(input: { system: string; turns: ChatTurn[] }): Promise<GenerateResult>;
  /** Plain-text summary used to compress conversation history that no longer fits the window. */
  summarize(input: { system: string; text: string }): Promise<string>;
}

export class ChatModelError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ChatModelError';
  }
}

export function createGeminiChatModel(opts: {
  apiKey: string;
  /** Per-request timeout; a hung call rejects with a ChatModelError instead of holding the turn. */
  timeoutMs?: number;
  model: string;
  log: Logger;
}): ChatModel {
  const ai = new GoogleGenAI({
    apiKey: opts.apiKey,
    ...(opts.timeoutMs ? { httpOptions: { timeout: opts.timeoutMs } } : {}),
  });
  return {
    model: opts.model,
    async generateGuidance({ system, turns }) {
      try {
        const res = await ai.models.generateContent({
          model: opts.model,
          contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          config: {
            systemInstruction: system,
            responseMimeType: 'application/json',
            responseSchema: guidanceResponseSchema,
            temperature: 0.3,
            // Thinking models spend part of this budget on reasoning before the JSON; 2048 was
            // truncating ~25% of answers mid-JSON (see docs/evaluation-report.md).
            maxOutputTokens: 8192,
          },
        });
        const finishReason = res.candidates?.[0]?.finishReason;
        const raw = res.text;
        if (finishReason === FinishReason.MAX_TOKENS || finishReason === FinishReason.SAFETY) {
          throw new ChatModelError(
            finishReason === FinishReason.MAX_TOKENS
              ? 'The model ran out of output tokens before finishing the answer'
              : 'The provider blocked the answer for safety reasons',
          );
        }
        if (!raw) throw new ChatModelError('The model returned an empty response');
        return {
          raw,
          promptTokens: res.usageMetadata?.promptTokenCount,
          completionTokens: res.usageMetadata?.candidatesTokenCount,
          finishReason,
        };
      } catch (err) {
        if (err instanceof ChatModelError) throw err;
        const status = errorStatus(err);
        const message = providerErrorMessage(err) ?? 'Unknown provider error';
        opts.log.error({ err, status }, 'chat model call failed');
        throw new ChatModelError(message, status);
      }
    },
    async summarize({ system, text }) {
      try {
        const res = await ai.models.generateContent({
          model: opts.model,
          contents: [{ role: 'user', parts: [{ text }] }],
          config: { systemInstruction: system, temperature: 0.2, maxOutputTokens: 512 },
        });
        return (res.text ?? '').trim();
      } catch (err) {
        opts.log.error({ err }, 'summary call failed');
        throw new ChatModelError(
          providerErrorMessage(err) ?? 'Unknown provider error',
          errorStatus(err),
        );
      }
    },
  };
}

/**
 * Deterministic fake for tests: covered when sections are present, cites all of them,
 * echoes the first section title so assertions can check grounding.
 */
export interface FakeChatModel extends ChatModel {
  calls: { system: string; turns: ChatTurn[] }[];
  summaries: string[];
  failNext: Error | undefined;
}

export function createFakeChatModel(): FakeChatModel {
  const fake: FakeChatModel = {
    model: 'fake-chat',
    calls: [],
    summaries: [],
    failNext: undefined,
    summarize({ text }) {
      const summary = `Summary of earlier conversation (${text.split('\n').filter((l) => l.startsWith('[')).length} messages).`;
      fake.summaries.push(summary);
      return Promise.resolve(summary);
    },
    generateGuidance(input: { system: string; turns: ChatTurn[] }): Promise<GenerateResult> {
      fake.calls.push(input);
      if (fake.failNext) {
        const err = fake.failNext;
        fake.failNext = undefined;
        return Promise.reject(
          err instanceof ChatModelError ? err : new ChatModelError(err.message),
        );
      }
      const last = input.turns[input.turns.length - 1]!.text;
      const sectionIds = [...last.matchAll(/^\[(S\d+)\] (.+)$/gm)].map((m) => ({
        id: m[1]!,
        title: m[2]!,
      }));
      const isInstruction = last.includes('<agent_instruction>');
      const guidance = {
        coverage: sectionIds.length ? 'covered' : 'not_covered',
        recommendedReply: sectionIds.length
          ? `Hello [Name], regarding ${sectionIds[0]!.title.toLowerCase()}: we will take care of it.${isInstruction ? ' (revised)' : ''}`
          : 'Hello [Name], thank you for reaching out. I am checking this with the team and will get back to you shortly.',
        handlingSteps: sectionIds.length
          ? [`Follow the "${sectionIds[0]!.title}" procedure`]
          : ['Escalate to a senior agent'],
        clarifications: sectionIds.length ? ['Would you prefer a replacement or a refund?'] : [],
        agentDecisions: sectionIds.length ? ['Offer compensation if appropriate'] : [],
        escalation: { recommended: sectionIds.length === 0, to: null, reason: null },
        citations: sectionIds.map((s) => s.id),
        notes: null,
      };
      return Promise.resolve({
        raw: JSON.stringify(guidance),
        promptTokens: 100,
        completionTokens: 50,
      });
    },
  };
  return fake;
}
