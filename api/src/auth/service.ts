import { UnauthorizedError, type TokenSet } from '@app/api-server-sdk';

import { type TokenSigner } from './jwt.js';
import { verifyPassword } from './password.js';
import { type RefreshTokenStore } from './refresh-tokens.js';
import { type AuthUser, findUserById, findUserByUsername, toAuthUser } from './users.js';
import { type Db } from '../db/client.js';

export interface Session {
  tokens: TokenSet;
  user: AuthUser;
}

export interface AuthService {
  login(username: string, password: string): Promise<Session>;
  /** Rotates a refresh token. Any failure is a 401; reuse revokes the whole family. */
  refresh(refreshToken: string): Promise<Session>;
  logout(refreshToken: string): Promise<boolean>;
  /** Resolves a bearer access token to a user, or null when missing/invalid/expired/unknown. */
  authenticate(bearer: string | undefined): Promise<AuthUser | null>;
}

export function createAuthService(
  db: Db,
  tokens: TokenSigner,
  refreshTokens: RefreshTokenStore,
): AuthService {
  async function session(userId: string, username: string, familyId?: string): Promise<Session> {
    const user = await findUserById(db, userId);
    if (!user) throw new UnauthorizedError({ message: 'User no longer exists' });
    const [access, refresh] = await Promise.all([
      tokens.sign({ sub: user.id, username }),
      refreshTokens.issue(user.id, familyId),
    ]);
    return {
      tokens: {
        accessToken: access.token,
        accessExpiresAt: access.expiresAt,
        refreshToken: refresh.token,
        refreshExpiresAt: refresh.expiresAt,
      },
      user: toAuthUser(user),
    };
  }

  return {
    async login(username, password) {
      const user = await findUserByUsername(db, username);
      // Same error for unknown user and wrong password: do not leak which usernames exist.
      const ok = user ? await verifyPassword(user.passwordHash, password) : false;
      if (!user || !ok) throw new UnauthorizedError({ message: 'Invalid username or password' });
      return session(user.id, user.username);
    },

    async refresh(refreshToken) {
      const outcome = await refreshTokens.rotate(refreshToken);
      if (!outcome.ok) {
        const messages = {
          unknown: 'Invalid refresh token',
          expired: 'Your session has expired. Please log in again.',
          reused:
            'This session was revoked because a refresh token was reused. Please log in again.',
          revoked: 'This session has been logged out. Please log in again.',
        } as const;
        throw new UnauthorizedError({ message: messages[outcome.reason] });
      }
      const user = await findUserById(db, outcome.userId);
      if (!user) throw new UnauthorizedError({ message: 'User no longer exists' });
      const access = await tokens.sign({ sub: user.id, username: user.username });
      return {
        tokens: {
          accessToken: access.token,
          accessExpiresAt: access.expiresAt,
          refreshToken: outcome.next.token,
          refreshExpiresAt: outcome.next.expiresAt,
        },
        user: toAuthUser(user),
      };
    },

    logout: (refreshToken) => refreshTokens.logout(refreshToken),

    async authenticate(bearer) {
      if (!bearer) return null;
      const claims = await tokens.verify(bearer);
      if (!claims) return null;
      const user = await findUserById(db, claims.sub);
      return user ? toAuthUser(user) : null;
    },
  };
}

export function bearerFromHeader(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token.trim() : undefined;
}
