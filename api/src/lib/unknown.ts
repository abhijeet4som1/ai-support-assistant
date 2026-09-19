/** Small, assertion-free helpers for values of type `unknown` (errors, JSON, external objects). */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** HTTP-ish status carried by SDK errors (Gemini's ApiError, fetch errors), if any. */
export function errorStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const status = err.status ?? err.statusCode;
  return typeof status === 'number' ? status : undefined;
}

/** Postgres error code, walking the `cause` chain Drizzle wraps errors in. */
export function pgErrorCode(err: unknown): string | undefined {
  let current: unknown = err;
  for (let depth = 0; depth < 4 && isRecord(current); depth++) {
    if (typeof current.code === 'string') return current.code;
    current = current.cause;
  }
  return undefined;
}

/** Parses JSON without throwing; returns undefined for invalid input. */
export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** Provider errors (Gemini) put a JSON envelope in `message`: `{"error":{"message":..,"status":..}}`. */
export function providerErrorMessage(err: unknown): string | undefined {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : undefined;
  if (!raw) return undefined;
  const parsed = tryParseJson(raw);
  if (isRecord(parsed) && isRecord(parsed.error) && typeof parsed.error.message === 'string') {
    const status = typeof parsed.error.status === 'string' ? ` (${parsed.error.status})` : '';
    return `${parsed.error.message}${status}`;
  }
  return raw;
}
