import { type AssistantGuidance, type Coverage } from '@app/api-server-sdk';
import { Type, type Schema } from '@google/genai';
import { z } from 'zod';

import { type RetrievedChunk } from './retrieval.js';

/** JSON schema handed to Gemini as `responseSchema` (structured output). */
export const guidanceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    coverage: { type: Type.STRING, enum: ['covered', 'partial', 'not_covered'] },
    recommendedReply: { type: Type.STRING },
    handlingSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Internal steps for the agent, in order',
    },
    clarifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Questions the customer must answer before the case can be resolved (preferences, missing details)',
    },
    agentDecisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Decisions the guidelines leave to the agent (e.g. whether to offer compensation); never questions for the customer',
    },
    escalation: {
      type: Type.OBJECT,
      properties: {
        recommended: { type: Type.BOOLEAN },
        to: { type: Type.STRING, nullable: true },
        reason: { type: Type.STRING, nullable: true },
      },
      required: ['recommended'],
    },
    citations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Section ids (e.g. "S2") actually used',
    },
    notes: { type: Type.STRING, nullable: true },
  },
  required: [
    'coverage',
    'recommendedReply',
    'handlingSteps',
    'agentDecisions',
    'escalation',
    'citations',
  ],
  propertyOrdering: [
    'coverage',
    'recommendedReply',
    'handlingSteps',
    'agentDecisions',
    'escalation',
    'citations',
    'notes',
  ],
};

const rawGuidance = z.object({
  coverage: z.enum(['covered', 'partial', 'not_covered']).catch('partial'),
  recommendedReply: z.string().catch(''),
  handlingSteps: z.array(z.string()).catch([]),
  clarifications: z.array(z.string()).catch([]),
  agentDecisions: z.array(z.string()).catch([]),
  escalation: z
    .object({
      recommended: z.boolean().catch(false),
      to: z.string().nullable().catch(null),
      reason: z.string().nullable().catch(null),
    })
    .catch({ recommended: false, to: null, reason: null }),
  citations: z.array(z.union([z.string(), z.object({ sectionId: z.string() })])).catch([]),
  notes: z.string().nullable().catch(null),
});

export class GuidanceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuidanceParseError';
  }
}

/**
 * Parses the model output and applies the server-side coverage gate:
 * - no retrieved sections ⇒ coverage is forced to not_covered with escalation,
 * - citations are restricted to sections that were actually provided.
 */
export function finalizeGuidance(
  raw: string,
  sections: { id: string; chunk: RetrievedChunk }[],
): AssistantGuidance {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new GuidanceParseError('Model returned invalid JSON');
  }
  const parsed = rawGuidance.safeParse(json);
  if (!parsed.success)
    throw new GuidanceParseError('Model output did not match the guidance schema');
  const g = parsed.data;

  const byId = new Map(sections.map((s) => [s.id, s.chunk]));
  const cited = g.citations
    .map((c) => (typeof c === 'string' ? c : c.sectionId))
    .filter((id, i, arr) => byId.has(id) && arr.indexOf(id) === i)
    .map((id) => ({ chunkId: byId.get(id)!.chunkId, title: byId.get(id)!.title ?? undefined }));

  let coverage: Coverage = g.coverage;
  let escalation = {
    recommended: g.escalation.recommended,
    to: g.escalation.to ?? undefined,
    reason: g.escalation.reason ?? undefined,
  };
  let notes = g.notes ?? undefined;
  if (sections.length === 0) {
    coverage = 'not_covered';
    escalation = {
      recommended: true,
      to: escalation.to ?? 'Team lead / senior agent',
      reason: escalation.reason ?? 'The guidelines do not cover this request',
    };
    notes = notes ?? 'No relevant guideline section was found for this message.';
  }

  // Defence in depth against prompt injection: a support reply never contains source code.
  if (looksLikeCode(g.recommendedReply) || g.handlingSteps.some(looksLikeCode)) {
    coverage = 'not_covered';
    escalation = {
      recommended: true,
      to: escalation.to ?? 'Team lead / senior agent',
      reason: 'The request appears to be out of scope',
    };
    notes = [
      notes,
      'The generated reply contained code and was flagged as out of scope for customer support.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return {
    coverage,
    recommendedReply: g.recommendedReply,
    handlingSteps: g.handlingSteps,
    clarifications: g.clarifications,
    agentDecisions: g.agentDecisions,
    escalation,
    citations: cited,
    notes,
  };
}

function stripCodeFence(text: string) {
  const m = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/.exec(text);
  return m ? m[1]! : text;
}

/** Heuristic: fenced code blocks or typical source-code line starts. */
export function looksLikeCode(text: string): boolean {
  if (text.includes('```')) return true;
  return /^\s*(def |class |import |from \w+ import |function |const |let |var |#include|public |print\(|console\.log\()/m.test(
    text,
  );
}
