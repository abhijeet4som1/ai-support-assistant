/**
 * `Object.entries` types values as `any` for interfaces without an index signature. This helper is
 * the single place that re-attaches the key/value types (a known TypeScript gap, not a runtime cast).
 */
export const typedEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as [keyof T & string, T[keyof T]][];
