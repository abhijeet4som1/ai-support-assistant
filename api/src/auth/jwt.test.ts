import { createTokenSigner } from './jwt.js';

describe('token signer', () => {
  const signer = createTokenSigner('test-secret-at-least-16-chars', 15);

  it('round-trips claims', async () => {
    const { token, expiresAt } = await signer.sign({ sub: 'u1', username: 'agent1' });
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    await expect(signer.verify(token)).resolves.toEqual({ sub: 'u1', username: 'agent1' });
  });

  it('rejects tokens signed with another secret', async () => {
    const other = createTokenSigner('another-secret-at-least-16', 1);
    const { token } = await other.sign({ sub: 'u1', username: 'agent1' });
    await expect(signer.verify(token)).resolves.toBeNull();
  });

  it('rejects garbage', async () => {
    await expect(signer.verify('not-a-jwt')).resolves.toBeNull();
  });

  it('rejects expired tokens', async () => {
    const expired = createTokenSigner('test-secret-at-least-16-chars', -1);
    const { token } = await expired.sign({ sub: 'u1', username: 'agent1' });
    await expect(signer.verify(token)).resolves.toBeNull();
  });
});
