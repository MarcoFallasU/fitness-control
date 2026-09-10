import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { measurements } from '@/lib/db/schema';
import type { MeasurementEntry, MeasurementZone } from '@/lib/types';

function toEntry(row: typeof measurements.$inferSelect): MeasurementEntry {
    return { id: row.id, userId: row.userId, date: row.date, values: row.values };
}

export async function getMeasurements(userId: string): Promise<MeasurementEntry[]> {
    const rows = await db.select().from(measurements).where(eq(measurements.userId, userId));
    return rows.map(toEntry).sort((a, b) => a.date.localeCompare(b.date));
}

export async function addMeasurement(userId: string, date: string, values: Partial<Record<MeasurementZone, number>>): Promise<MeasurementEntry> {
    const id = crypto.randomUUID();
    await db.insert(measurements).values({ id, userId, date, values });
    return { id, userId, date, values };
}
