/**
 * Prompt templates: the fixed text sent to the model lives in `api/prompts/*.md` (see the README
 * there) so wording changes are reviewable on their own. This module reads them once at start-up
 * and fills `{{placeholders}}`, failing loudly on a missing or unknown placeholder.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const promptsDir = fileURLToPath(new URL('../../prompts/', import.meta.url));

export const TEMPLATE_NAMES = [
  'chat-system',
  'chat-no-sections',
  'chat-summary-ack',
  'summary-system',
] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function load(name: TemplateName): string {
  // Trailing newline is an artefact of the editor, not part of the prompt.
  return readFileSync(new URL(`${name}.md`, `file://${promptsDir}`), 'utf8').replace(/\n+$/, '');
}

const templates: Record<TemplateName, string> = Object.fromEntries(
  TEMPLATE_NAMES.map((name) => [name, load(name)]),
) as Record<TemplateName, string>;

/** Names of the `{{placeholders}}` a template expects. */
export function placeholdersOf(name: TemplateName): string[] {
  return [...templates[name].matchAll(PLACEHOLDER)].map((m) => m[1]!);
}

/**
 * Fills the template's placeholders. Throws when a placeholder has no value or a value has no
 * placeholder, so a renamed variable cannot silently send `{{companyName}}` to the model.
 */
export function renderTemplate(name: TemplateName, values: Record<string, string> = {}): string {
  const expected = new Set(placeholdersOf(name));
  for (const key of Object.keys(values)) {
    if (!expected.has(key))
      throw new Error(`prompt template "${name}" has no placeholder {{${key}}}`);
  }
  return templates[name].replace(PLACEHOLDER, (_, key: string) => {
    const value = values[key];
    if (value === undefined)
      throw new Error(`prompt template "${name}": missing value for {{${key}}}`);
    return value;
  });
}
