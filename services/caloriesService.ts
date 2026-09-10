import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { calories } from '@/lib/db/schema';
import type { CalorieEntry } from '@/lib/types';

export async function getCalories(userId: string): Promise<CalorieEntry[]> {
    const rows = await db.select().from(calories).where(eq(calories.userId, userId));
    return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export async function setCalories(userId: string, date: string, value: number): Promise<CalorieEntry> {
    const rows = await db.select().from(calories).where(and(eq(calories.userId, userId), eq(calories.date, date))).limit(1);
    const existing = rows[0];
    if (existing) {
        await db.update(calories).set({ calories: value }).where(eq(calories.id, existing.id));
        return { ...existing, calories: value };
    }
    const entry = { id: crypto.randomUUID(), userId, date, calories: value };
    await db.insert(calories).values(entry);
    return entry;
}
