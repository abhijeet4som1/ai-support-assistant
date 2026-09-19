import { InternalServerError, UnauthorizedError } from '@app/api-server-sdk';
import { type FastifyBaseLogger } from 'fastify';

import { type AuthUser } from '../auth/users.js';

/** Context passed by the HTTP adapter to every Smithy operation handler. */
export interface HandlerContext {
  requestId: string;
  log: FastifyBaseLogger;
  /** Set when a valid bearer token was presented. */
  user?: AuthUser;
  /** True when an Authorization header was present but the token was invalid or expired. */
  badToken: boolean;
}

export interface AuthedContext extends HandlerContext {
  user: AuthUser;
}

/** Shape of a generated Smithy operation handler. */
export type Operation<I, O, C> = (input: I, ctx: C) => Promise<O>;
export type AuthedOperation<I, O> = (input: I, ctx: AuthedContext) => Promise<O>;

/**
 * Generated ServerInput types mark @required members as optional (the SDK validates presence
 * before calling us). `must` narrows them without sprinkling non-null assertions around.
 */
export function must<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) {
    throw new InternalServerError({ message: `Required input "${name}" missing after validation` });
  }
  return value;
}

/** Wraps an operation so it only runs for authenticated users (401 otherwise). */
export function authed<I, O>(op: AuthedOperation<I, O>): Operation<I, O, HandlerContext> {
  return (input, ctx) => {
    if (!ctx.user) {
      throw new UnauthorizedError({
        message: ctx.badToken
          ? 'Your session is invalid or has expired. Please log in again.'
          : 'Authentication required',
      });
    }
    return op(input, { ...ctx, user: ctx.user });
  };
}
