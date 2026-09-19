import { readFile } from 'node:fs/promises';

import { chunkText, headingTitle, normalizeText } from './chunker.js';

const sample = (name: string) =>
  readFile(new URL(`../../seed/guidelines/${name}`, import.meta.url), 'utf8');

describe('headingTitle', () => {
  it('recognises numbered, markdown and all-caps headings', () => {
    expect(headingTitle('1. Shipping Issues')).toBe('Shipping Issues');
    expect(headingTitle('10) Account Access or Permission Problems')).toBe(
      'Account Access or Permission Problems',
    );
    expect(headingTitle('## Refunds')).toBe('Refunds');
    expect(headingTitle('BILLING AND PAYMENTS')).toBe('BILLING AND PAYMENTS');
  });
  it('does not treat ordinary sentences or list items as headings', () => {
    expect(
      headingTitle('1. Verify the order and contact the courier for an updated ETA.'),
    ).toBeNull();
    expect(headingTitle('- Acknowledge the delay or problem.')).toBeNull();
    expect(headingTitle('Hello [Name],')).toBeNull();
  });
});

describe('chunkText on the sample guidelines', () => {
  it('produces one chunk per topic for the bookshop file', async () => {
    const chunks = chunkText(await sample('bookshop_support_guidelines.txt'));
    expect(chunks.map((c) => c.title)).toEqual([
      'Shipping Issues',
      'Wrong Product Delivered',
      'Damaged Product Received',
      'Returns and Refunds',
      'Payment and Billing Issues',
      'Order Modifications and Cancellations',
      'Product Availability and Backorders',
    ]);
    expect(chunks.every((c) => c.content.includes('Sample reply'))).toBe(true);
    expect(chunks.map((c) => c.ordinal)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('produces ten topics for the VPN file', async () => {
    const chunks = chunkText(await sample('vpn_support_guidelines.txt'));
    expect(chunks).toHaveLength(10);
    expect(chunks[0]!.title).toBe('Connection Failures');
    expect(chunks[9]!.title).toBe('Account Access or Permission Problems');
  });
});

describe('chunkText fallbacks', () => {
  it('splits unstructured text into overlapping windows', () => {
    const para = 'Customers may ask about delivery times, refunds and account access. '.repeat(12);
    const text = Array.from({ length: 8 }, () => para.trim()).join('\n\n');
    const chunks = chunkText(text, { targetTokens: 400, maxTokens: 800, overlapTokens: 60 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.title === null)).toBe(true);
    expect(chunks.every((c) => c.tokenCount <= 800)).toBe(true);
  });

  it('splits an oversized section into titled parts', () => {
    const body = Array.from(
      { length: 30 },
      (_, i) => `Paragraph ${i} about refunds and their processing timelines in detail.`,
    ).join('\n\n');
    const chunks = chunkText(`1. Refunds\n${body}`, {
      targetTokens: 100,
      maxTokens: 150,
      overlapTokens: 20,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.title).toBe('Refunds (part 1)');
  });

  it('returns nothing for empty input and normalises line endings', () => {
    expect(chunkText('   \n\n ')).toEqual([]);
    expect(normalizeText('a\r\nb\r\n\r\n\r\nc')).toBe('a\nb\n\nc');
  });
});
