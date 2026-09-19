import { eq } from 'drizzle-orm';

import { hashPassword } from './password.js';
import { type Db, schema } from '../db/client.js';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export const toAuthUser = (u: schema.User): AuthUser => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
});

export const findUserByUsername = (db: Db, username: string) =>
  db.query.users.findFirst({ where: eq(schema.users.username, username) });

export const findUserById = (db: Db, id: string) =>
  db.query.users.findFirst({ where: eq(schema.users.id, id) });

/** Parses `user:password,user2:password2`. */
export function parseSeedUsers(spec: string): { username: string; password: string }[] {
  return spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(':');
      if (idx <= 0 || idx === pair.length - 1) {
        throw new Error(`SEED_USERS entry "${pair}" must look like username:password`);
      }
      return { username: pair.slice(0, idx), password: pair.slice(idx + 1) };
    });
}

/** Creates seed users that do not exist yet; never overwrites an existing password. */
export async function seedUsers(db: Db, spec: string) {
  const created: string[] = [];
  for (const { username, password } of parseSeedUsers(spec)) {
    const existing = await findUserByUsername(db, username);
    if (existing) continue;
    await db.insert(schema.users).values({
      username,
      passwordHash: await hashPassword(password),
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
    });
    created.push(username);
  }
  return created;
}
