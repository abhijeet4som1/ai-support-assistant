import { detectFileKind, extractText } from './parsers.js';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('detectFileKind', () => {
  it('maps extensions to parsers', () => {
    expect(detectFileKind('a.txt', bytes('hi')).kind).toBe('text');
    expect(detectFileKind('a.MD', bytes('# hi')).kind).toBe('markdown');
    expect(detectFileKind('a.pdf', bytes('%PDF-1.4 ...')).kind).toBe('pdf');
    expect(detectFileKind('a.docx', new Uint8Array([0x50, 0x4b, 3, 4])).kind).toBe('docx');
  });
  it('falls back to the declared type for text without a known extension', () => {
    expect(detectFileKind('notes', bytes('hi'), 'text/plain').kind).toBe('text');
  });
  it('rejects unknown types and mislabeled binaries', () => {
    expect(() => detectFileKind('a.exe', bytes('MZ'))).toThrow(/Unsupported file type/);
    expect(() => detectFileKind('a.pdf', bytes('not a pdf'))).toThrow(/Unsupported file type/);
  });
});

describe('extractText', () => {
  it('decodes text and markdown', async () => {
    expect(await extractText('text', bytes('hello\nworld'))).toBe('hello\nworld');
    expect(await extractText('markdown', bytes('# T\nbody'))).toBe('# T\nbody');
  });
});
