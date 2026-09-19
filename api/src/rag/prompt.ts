/**
 * Assembles the prompt for a chat turn. All fixed wording comes from the templates in
 * `api/prompts/` (see `templates.ts`); this module only adds the dynamic parts: retrieved
 * sections, corrections, the rolling summary, history and the latest message.
 */
import { type RetrievedChunk, type RetrievedCorrection } from './retrieval.js';
import { renderTemplate } from './templates.js';

export interface HistoryTurn {
  role: 'customer' | 'instruction' | 'assistant';
  content: string;
}

export interface PromptInput {
  companyName: string;
  /** Rolling summary of messages older than the history window, if any. */
  summary?: string;
  sections: RetrievedChunk[];
  corrections: RetrievedCorrection[];
  history: HistoryTurn[];
  latest: { kind: 'customer' | 'instruction'; content: string };
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface BuiltPrompt {
  system: string;
  turns: ChatTurn[];
  /** Section ids as shown to the model, mapped back to chunks. */
  sectionIds: { id: string; chunk: RetrievedChunk }[];
}

export function buildSystemPrompt(companyName: string): string {
  return renderTemplate('chat-system', { companyName });
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const sectionIds = input.sections.map((chunk, i) => ({ id: `S${i + 1}`, chunk }));
  const context: string[] = [];

  if (sectionIds.length) {
    context.push('<guideline_sections>');
    for (const { id, chunk } of sectionIds) {
      context.push(`[${id}] ${chunk.title ?? 'Untitled section'}\n${chunk.content}`);
    }
    context.push('</guideline_sections>');
  } else {
    context.push(renderTemplate('chat-no-sections'));
  }

  if (input.corrections.length) {
    context.push('<corrections note="from senior agents; lower authority than the sections">');
    input.corrections.forEach((c, i) => {
      const lines = [`[C${i + 1}] Customer message: ${c.queryText}`];
      if (c.rating === 'down') {
        if (c.whatWasWrong) lines.push(`What was wrong in a previous answer: ${c.whatWasWrong}`);
        if (c.correctedAnswer) lines.push(`Correct answer: ${c.correctedAnswer}`);
      } else {
        lines.push('A previous answer to this was rated helpful by an agent.');
      }
      context.push(lines.join('\n'));
    });
    context.push('</corrections>');
  }

  const turns: ChatTurn[] = [];
  if (input.summary) {
    turns.push({
      role: 'user',
      text: `<conversation_summary>\n${input.summary}\n</conversation_summary>`,
    });
    turns.push({ role: 'model', text: renderTemplate('chat-summary-ack') });
  }
  for (const h of input.history) {
    if (h.role === 'assistant') turns.push({ role: 'model', text: h.content });
    else if (h.role === 'customer') turns.push({ role: 'user', text: wrapCustomer(h.content) });
    else turns.push({ role: 'user', text: wrapInstruction(h.content) });
  }
  const latest =
    input.latest.kind === 'customer'
      ? wrapCustomer(input.latest.content)
      : wrapInstruction(input.latest.content);
  turns.push({ role: 'user', text: `${context.join('\n\n')}\n\n${latest}` });

  return { system: buildSystemPrompt(input.companyName), turns, sectionIds };
}

const wrapCustomer = (text: string) =>
  `<customer_message>\n${text.replace(/<\/?customer_message>/g, '')}\n</customer_message>`;
const wrapInstruction = (text: string) => `<agent_instruction>\n${text}\n</agent_instruction>`;

/** Cheap token estimate (≈4 chars/token). Mirrors the ingestion chunker. */
export const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

export const estimatePromptTokens = (prompt: { system: string; turns: ChatTurn[] }) =>
  estimateTokens(prompt.system) + prompt.turns.reduce((n, t) => n + estimateTokens(t.text), 0);

export const SUMMARY_SYSTEM_PROMPT = renderTemplate('summary-system');

/** Formats older turns for the summariser (and for appending to an existing summary). */
export function transcriptForSummary(
  previousSummary: string | undefined,
  turns: HistoryTurn[],
): string {
  const lines = turns.map((t) => `[${t.role}] ${t.content}`);
  return previousSummary
    ? `Previous summary:\n${previousSummary}\n\nNew messages:\n${lines.join('\n')}`
    : lines.join('\n');
}

/**
 * Drops the oldest history turns until the assembled prompt fits the token budget.
 * The latest turn (which carries the retrieved context) is never dropped.
 */
export function fitHistoryToBudget(
  input: PromptInput,
  budgetTokens: number,
): { prompt: BuiltPrompt; dropped: number } {
  let history = input.history;
  let dropped = 0;
  let prompt = buildPrompt({ ...input, history });
  while (history.length > 0 && estimatePromptTokens(prompt) > budgetTokens) {
    history = history.slice(1);
    dropped++;
    prompt = buildPrompt({ ...input, history });
  }
  return { prompt, dropped };
}

/** Retrieval query for a turn: latest customer message plus the previous one (handles "yes, that one"). */
export function retrievalQuery(
  history: HistoryTurn[],
  latest: { kind: 'customer' | 'instruction'; content: string },
) {
  const customers = history.filter((h) => h.role === 'customer').map((h) => h.content);
  if (latest.kind === 'customer') {
    const prev = customers[customers.length - 1];
    return prev && latest.content.length < 120 ? `${prev}\n${latest.content}` : latest.content;
  }
  return customers[customers.length - 1] ?? latest.content;
}
