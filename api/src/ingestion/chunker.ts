/**
 * Heading-aware chunker. Guideline documents are usually organised by topic
 * ("1. Shipping Issues", "## Refunds", "BILLING"), and one topic per chunk gives the
 * best retrieval units. Long topics and unstructured text fall back to a sliding
 * window over paragraphs with overlap.
 */
export interface Chunk {
  ordinal: number;
  title: string | null;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  /** Target size for windowed chunks. */
  targetTokens?: number;
  /** Hard cap for any chunk; larger topics are split. */
  maxTokens?: number;
  overlapTokens?: number;
}

const DEFAULTS: Required<ChunkOptions> = { targetTokens: 400, maxTokens: 800, overlapTokens: 60 };

/** Cheap token estimate (≈4 chars/token for English prose). */
export const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

// Control characters other than tab/newline (built without literal escapes in the source).
const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  'g',
);

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const NUMBERED = /^\s*(\d{1,3})[.)]\s+(\S.{0,120})$/;
const MARKDOWN = /^\s*#{1,6}\s+(\S.{0,120})$/;
const ALL_CAPS = /^\s*([A-Z][A-Z0-9 &/',-]{2,79})\s*$/;

/** Returns the heading title when the line looks like a section heading. */
export function headingTitle(line: string): string | null {
  const m1 = MARKDOWN.exec(line);
  if (m1) return m1[1]!.trim();
  const m2 = NUMBERED.exec(line);
  if (m2) {
    const title = m2[2]!.trim();
    if (!/[.!?]$/.test(title) && title.split(/\s+/).length <= 12) return title;
  }
  const m3 = ALL_CAPS.exec(line);
  if (m3 && /[A-Z]{3,}/.test(m3[1]!)) return m3[1]!.trim();
  return null;
}

interface Section {
  title: string | null;
  lines: string[];
}

function splitSections(text: string): Section[] {
  const sections: Section[] = [{ title: null, lines: [] }];
  for (const line of text.split('\n')) {
    const title = headingTitle(line);
    if (title) sections.push({ title, lines: [line.trim()] });
    else sections[sections.length - 1]!.lines.push(line);
  }
  return sections.filter((s) => s.lines.join('\n').trim().length > 0);
}

function windows(paragraphs: string[], opts: Required<ChunkOptions>): string[] {
  const out: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;
  const flush = () => {
    if (current.length) out.push(current.join('\n\n'));
  };
  for (const p of paragraphs) {
    const t = estimateTokens(p);
    if (t > opts.maxTokens) {
      // Pathological paragraph (no blank lines): hard-split by sentences.
      flush();
      current = [];
      currentTokens = 0;
      let buf = '';
      for (const sentence of p.split(/(?<=[.!?])\s+/)) {
        if (estimateTokens(`${buf} ${sentence}`) > opts.targetTokens && buf) {
          out.push(buf.trim());
          buf = '';
        }
        buf += ` ${sentence}`;
      }
      if (buf.trim()) out.push(buf.trim());
      continue;
    }
    if (currentTokens + t > opts.targetTokens && current.length) {
      flush();
      // Overlap: carry the tail of the previous window.
      const tail: string[] = [];
      let tailTokens = 0;
      for (let i = current.length - 1; i >= 0 && tailTokens < opts.overlapTokens; i--) {
        tail.unshift(current[i]!);
        tailTokens += estimateTokens(current[i]!);
      }
      current = tail;
      currentTokens = tailTokens;
    }
    current.push(p);
    currentTokens += t;
  }
  flush();
  return out;
}

export function chunkText(raw: string, options: ChunkOptions = {}): Chunk[] {
  const opts = { ...DEFAULTS, ...options };
  const text = normalizeText(raw);
  if (!text) return [];
  const sections = splitSections(text);
  const chunks: Chunk[] = [];
  const push = (title: string | null, content: string) => {
    const c = content.trim();
    if (!c) return;
    chunks.push({ ordinal: chunks.length, title, content: c, tokenCount: estimateTokens(c) });
  };

  for (const section of sections) {
    const content = section.lines.join('\n').trim();
    if (estimateTokens(content) <= opts.maxTokens) {
      push(section.title, content);
      continue;
    }
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const parts = windows(paragraphs, opts);
    parts.forEach((part, i) =>
      push(section.title ? `${section.title} (part ${i + 1})` : null, part),
    );
  }

  // Merge tiny trailing fragments (e.g. a lone heading) into their neighbour.
  return chunks.reduce<Chunk[]>((acc, c) => {
    const prev = acc[acc.length - 1];
    if (prev && c.content.length < 40 && prev.title === c.title) {
      prev.content += `\n${c.content}`;
      prev.tokenCount = estimateTokens(prev.content);
      return acc;
    }
    acc.push({ ...c, ordinal: acc.length });
    return acc;
  }, []);
}
