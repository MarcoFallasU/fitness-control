import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sessions, users } from '@/lib/db/schema';
import type { User } from '@/lib/types';

const COOKIE_NAME = 'ironlog_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function toPublicUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    color: row.color,
  };
}

export async function createSession(userId: string): Promise<void> {
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  await db.insert(sessions).values({ id, userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }
  return toPublicUser(row.user);
}
