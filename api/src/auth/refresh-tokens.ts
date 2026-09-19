/**
 * Opaque refresh tokens with rotation and reuse detection.
 * - The raw token is random and only its SHA-256 hash is stored.
 * - Every refresh revokes the presented token and issues a new one in the same family.
 * - Presenting a token that was already rotated means it leaked: the whole family is revoked.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { and, eq, isNull } from 'drizzle-orm';

import { type Db, schema } from '../db/client.js';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
  familyId: string;
}

export type RefreshOutcome =
  | { ok: true; userId: string; next: IssuedRefreshToken }
  | { ok: false; reason: 'unknown' | 'expired' | 'reused' | 'revoked' };

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export function createRefreshTokenStore(db: Db, ttlDays: number) {
  const ttlMs = ttlDays * 24 * 3600 * 1000;

  async function issue(
    userId: string,
    familyId: string = randomUUID(),
  ): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlMs);
    await db
      .insert(schema.refreshTokens)
      .values({ userId, familyId, tokenHash: hash(token), expiresAt });
    return { token, expiresAt, familyId };
  }

  async function revokeFamily(familyId: string) {
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(schema.refreshTokens.familyId, familyId), isNull(schema.refreshTokens.revokedAt)),
      );
  }

  return {
    issue,
    revokeFamily,

    async rotate(token: string): Promise<RefreshOutcome> {
      const row = await db.query.refreshTokens.findFirst({
        where: eq(schema.refreshTokens.tokenHash, hash(token)),
      });
      if (!row) return { ok: false, reason: 'unknown' };
      if (row.revokedAt) {
        // Already rotated or logged out. If it was rotated, someone is replaying an old token.
        await revokeFamily(row.familyId);
        return { ok: false, reason: row.replacedBy ? 'reused' : 'revoked' };
      }
      if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'expired' };
      const next = await issue(row.userId, row.familyId);
      const [nextRow] = await db
        .select({ id: schema.refreshTokens.id })
        .from(schema.refreshTokens)
        .where(eq(schema.refreshTokens.tokenHash, hash(next.token)));
      await db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date(), replacedBy: nextRow?.id ?? null })
        .where(eq(schema.refreshTokens.id, row.id));
      return { ok: true, userId: row.userId, next };
    },

    /** Revokes the family of the given token. Returns false when the token is unknown. */
    async logout(token: string): Promise<boolean> {
      const row = await db.query.refreshTokens.findFirst({
        where: eq(schema.refreshTokens.tokenHash, hash(token)),
      });
      if (!row) return false;
      await revokeFamily(row.familyId);
      return true;
    },
  };
}

export type RefreshTokenStore = ReturnType<typeof createRefreshTokenStore>;
