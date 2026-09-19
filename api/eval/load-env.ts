import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Minimal .env loader for eval scripts run on the host (does not override existing variables). */
export function loadDotEnv() {
  const path = fileURLToPath(new URL('../../.env', import.meta.url));
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const [, key, raw] = m;
    if (process.env[key!] === undefined) process.env[key!] = raw!.replace(/^["']|["']$/g, '');
  }
}
