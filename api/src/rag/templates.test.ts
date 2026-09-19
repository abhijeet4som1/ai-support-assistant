import { readdirSync } from 'node:fs';

import { placeholdersOf, promptsDir, renderTemplate, TEMPLATE_NAMES } from './templates.js';

describe('prompt templates', () => {
  it('registers every template file in api/prompts and nothing else', () => {
    const files = readdirSync(promptsDir)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    expect(files).toEqual([...TEMPLATE_NAMES].sort());
  });

  it('renders every template without leaving a placeholder behind', () => {
    for (const name of TEMPLATE_NAMES) {
      const values = Object.fromEntries(placeholdersOf(name).map((p) => [p, `<${p}>`]));
      const text = renderTemplate(name, values);
      expect(text).not.toMatch(/\{\{/);
      expect(text.length).toBeGreaterThan(20);
      expect(text.endsWith('\n')).toBe(false);
    }
  });

  it('substitutes the company name into the chat system prompt', () => {
    expect(placeholdersOf('chat-system')).toEqual(['companyName']);
    const text = renderTemplate('chat-system', { companyName: 'Bookshop' });
    expect(text).toContain('agents at "Bookshop".');
    expect(text).toContain('Respond only with JSON');
  });

  it('fails loudly on a missing or unknown placeholder value', () => {
    expect(() => renderTemplate('chat-system')).toThrow(/missing value for \{\{companyName\}\}/);
    expect(() => renderTemplate('summary-system', { companyName: 'X' })).toThrow(
      /has no placeholder \{\{companyName\}\}/,
    );
  });
});
