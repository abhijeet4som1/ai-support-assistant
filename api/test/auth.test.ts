import { createTestApp } from './helpers/test-app.js';

interface SessionBody {
  tokens: {
    accessToken: string;
    accessExpiresAt: string;
    refreshToken: string;
    refreshExpiresAt: string;
  };
  user: { username: string; id: string };
}

describe('authentication', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  const login = (username = 'agent1', password = 'agent1pass') =>
    t.app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password } });
  const refresh = (refreshToken: string) =>
    t.app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken } });
  const me = (accessToken: string) =>
    t.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

  it('logs in a seeded user and returns an access token, a refresh token and the user', async () => {
    const res = await login();
    expect(res.statusCode).toBe(200);
    const body = res.json<SessionBody>();
    expect(body.tokens.accessToken.split('.')).toHaveLength(3);
    expect(body.tokens.refreshToken.length).toBeGreaterThan(30);
    expect(new Date(body.tokens.accessExpiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(body.tokens.refreshExpiresAt).getTime()).toBeGreaterThan(
      new Date(body.tokens.accessExpiresAt).getTime(),
    );
    expect(body.user).toMatchObject({ username: 'agent1' });
  });

  it('rejects a wrong password and an unknown user with the same 401', async () => {
    const wrong = await login('agent1', 'nope');
    const unknown = await login('ghost', 'nope');
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.headers['x-amzn-errortype']).toBe('UnauthorizedError');
    expect(wrong.json<object>()).toEqual(unknown.json<object>());
  });

  it('returns a ValidationException with field paths for bad input', async () => {
    const res = await login('', '');
    expect(res.statusCode).toBe(400);
    const body = res.json<{ fieldList: { path: string }[] }>();
    expect(body.fieldList.map((f) => f.path).sort()).toEqual(['/password', '/username']);
  });

  it('resolves the current user from a bearer access token', async () => {
    const token = await t.login();
    const res = await me(token);
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>()).toMatchObject({ user: { username: 'agent1' } });
  });

  it('requires a token for protected operations and rejects invalid ones', async () => {
    const none = await t.app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(none.statusCode).toBe(401);
    expect(none.json<{ message: string }>()).toMatchObject({ message: 'Authentication required' });
    const bad = await me('definitely.not.valid');
    expect(bad.statusCode).toBe(401);
    expect(bad.json<{ message: string }>().message).toMatch(/expired|invalid/i);
  });

  it('rotates refresh tokens: the new pair works, the old refresh token is dead', async () => {
    const first = (await login()).json<SessionBody>();
    const rotated = await refresh(first.tokens.refreshToken);
    expect(rotated.statusCode).toBe(200);
    const second = rotated.json<SessionBody>();
    expect(second.tokens.refreshToken).not.toBe(first.tokens.refreshToken);
    expect(second.tokens.accessToken).not.toBe(first.tokens.accessToken);
    expect((await me(second.tokens.accessToken)).statusCode).toBe(200);

    // Replaying the rotated token is treated as theft: the whole family is revoked.
    const replay = await refresh(first.tokens.refreshToken);
    expect(replay.statusCode).toBe(401);
    expect(replay.json<{ message: string }>().message).toMatch(/reused/i);
    const afterReplay = await refresh(second.tokens.refreshToken);
    expect(afterReplay.statusCode).toBe(401);
  });

  it('rejects unknown refresh tokens', async () => {
    const res = await refresh('not-a-real-token');
    expect(res.statusCode).toBe(401);
    expect(res.headers['x-amzn-errortype']).toBe('UnauthorizedError');
  });

  it('logout revokes the session family; other sessions are unaffected', async () => {
    const a = (await login()).json<SessionBody>();
    const b = (await login()).json<SessionBody>();
    const out = await t.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: { refreshToken: a.tokens.refreshToken },
    });
    expect(out.statusCode).toBe(200);
    expect(out.json<{ revoked: boolean }>().revoked).toBe(true);
    expect((await refresh(a.tokens.refreshToken)).statusCode).toBe(401);
    expect((await refresh(b.tokens.refreshToken)).statusCode).toBe(200);
    const again = await t.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: { refreshToken: 'unknown' },
    });
    expect(again.json<{ revoked: boolean }>().revoked).toBe(false);
  });

  it('protects every operation except Health, Login, Refresh and Logout', async () => {
    const protectedRoutes = [
      ['GET', '/api/companies'],
      ['POST', '/api/companies'],
      ['GET', '/api/conversations'],
      ['POST', '/api/conversations'],
      ['GET', '/api/companies/x/guidelines'],
      ['GET', '/api/guideline-versions/x'],
      ['PATCH', '/api/corrections/x'],
    ] as const;
    for (const [method, url] of protectedRoutes) {
      const res = await t.app.inject({ method, url, ...(method === 'GET' ? {} : { payload: {} }) });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
    }
  });
});
