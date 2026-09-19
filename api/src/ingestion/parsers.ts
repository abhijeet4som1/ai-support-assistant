import { UnsupportedMediaTypeError } from '@app/api-server-sdk';
import mammoth from 'mammoth';

export type SupportedKind = 'text' | 'markdown' | 'pdf' | 'docx';

export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.pdf', '.docx'] as const;

const CONTENT_TYPES: Record<SupportedKind, string> = {
  text: 'text/plain',
  markdown: 'text/markdown',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export interface DetectedFile {
  kind: SupportedKind;
  contentType: string;
}

/** Picks the parser from the file extension, sanity-checked against magic bytes. */
export function detectFileKind(
  filename: string,
  bytes: Uint8Array,
  declaredType?: string,
): DetectedFile {
  const ext = /\.[a-z0-9]+$/.exec(filename.toLowerCase())?.[0] ?? '';
  const isPdf =
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;
  const isZip = bytes.length > 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;

  let kind: SupportedKind | null = null;
  if (ext === '.pdf' || (isPdf && !ext)) kind = 'pdf';
  else if (ext === '.docx' || (isZip && declaredType === CONTENT_TYPES.docx)) kind = 'docx';
  else if (ext === '.md' || ext === '.markdown') kind = 'markdown';
  else if (ext === '.txt' || declaredType?.startsWith('text/')) kind = 'text';

  if (kind === 'pdf' && !isPdf) kind = null;
  if (kind === 'docx' && !isZip) kind = null;
  if (!kind) {
    throw new UnsupportedMediaTypeError({
      message: `Unsupported file type "${ext || declaredType || 'unknown'}". Upload a ${SUPPORTED_EXTENSIONS.join(', ')} file.`,
      supported: [...SUPPORTED_EXTENSIONS],
    });
  }
  return { kind, contentType: CONTENT_TYPES[kind] };
}

const decoder = new TextDecoder('utf-8', { fatal: false });

export async function extractText(kind: SupportedKind, bytes: Uint8Array): Promise<string> {
  switch (kind) {
    case 'text':
    case 'markdown':
      return decoder.decode(bytes);
    case 'pdf': {
      // pdf-parse's package entry runs debug code when imported as ESM; import the lib directly.
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(Buffer.from(bytes));
      return result.text;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return result.value;
    }
  }
}
