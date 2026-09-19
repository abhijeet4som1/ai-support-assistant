import { argon2id, hash, verify } from 'argon2';

export const hashPassword = (password: string) => hash(password, { type: argon2id });

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
