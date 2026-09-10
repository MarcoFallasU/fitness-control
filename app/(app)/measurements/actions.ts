'use server';
import { revalidatePath } from 'next/cache';
import { addMeasurement } from '@/services/measurementsService';
import type { MeasurementZone } from '@/lib/types';

export async function addMeasurementAction(userId: string, date: string, values: Partial<Record<MeasurementZone, number>>): Promise<void> {
    await addMeasurement(userId, date, values);
    revalidatePath('/measurements');
    revalidatePath('/dashboard');
}
