import { randomUUID } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

export interface TokenClaims {
  sub: string;
  username: string;
}

export interface TokenSigner {
  sign(claims: TokenClaims): Promise<{ token: string; expiresAt: Date }>;
  /** Returns the claims, or null when the token is invalid, expired or not issued by us. */
  verify(token: string): Promise<TokenClaims | null>;
}

export function createTokenSigner(secret: string, ttlMinutes: number): TokenSigner {
  const key = new TextEncoder().encode(secret);
  const issuer = 'ai-support-assistant';
  return {
    async sign(claims) {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      const token = await new SignJWT({ username: claims.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(claims.sub)
        .setJti(randomUUID()) // unique per token even when issued within the same second
        .setIssuer(issuer)
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(key);
      return { token, expiresAt };
    },
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, key, { issuer, algorithms: ['HS256'] });
        if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') return null;
        return { sub: payload.sub, username: payload.username };
      } catch {
        return null;
      }
    },
  };
}
