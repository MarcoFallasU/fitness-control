import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
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

export async function getAllUsers(): Promise<User[]> {
    const rows = await db.select().from(users);
    return rows.map(toPublicUser);
}

export async function getUser(userId: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0] ? toPublicUser(rows[0]) : undefined;
}
