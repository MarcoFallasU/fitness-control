import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { User } from '@/lib/types';

function toPublicUser(row: typeof users.$inferSelect): User {
    return {
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        color: row.color,
    };
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase())).limit(1);
    const row = rows[0];
    if (!row)
        return null;
    const valid = await verifyPassword(password, row.passwordHash);
    if (!valid)
        return null;
    return toPublicUser(row);
}

// The user list is tiny and almost never changes, so it is kept in memory for a minute
// instead of costing a database round trip on every navigation.
const USERS_TTL_MS = 60_000;
let usersCache: { at: number; users: User[] } | null = null;

export async function getAllUsers(): Promise<User[]> {
    if (usersCache && Date.now() - usersCache.at < USERS_TTL_MS)
        return usersCache.users;
    const rows = await db.select().from(users);
    const list = rows.map(toPublicUser);
    usersCache = { at: Date.now(), users: list };
    return list;
}

export async function getUser(userId: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0] ? toPublicUser(rows[0]) : undefined;
}

export async function updateProfile(userId: string, data: { displayName: string; color: string }): Promise<User | undefined> {
    await db.update(users).set({ displayName: data.displayName, color: data.color }).where(eq(users.id, userId));
    usersCache = null;
    return getUser(userId);
}

/** Returns false when the current password does not match. */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row || !(await verifyPassword(currentPassword, row.passwordHash)))
        return false;
    await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, userId));
    return true;
}
