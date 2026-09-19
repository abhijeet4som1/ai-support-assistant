import { pgErrorCode } from '../lib/unknown.js';

/** Detects a PostgreSQL unique-constraint violation through Drizzle's error wrapping. */
export const isUniqueViolation = (err: unknown): boolean => pgErrorCode(err) === '23505';
