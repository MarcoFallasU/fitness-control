'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { addMeasurement, deleteMeasurement } from '@/services/measurementsService';
import type { MeasurementZone } from '@/lib/types';

export async function addMeasurementAction(userId: string, date: string, values: Partial<Record<MeasurementZone, number>>): Promise<void> {
    await addMeasurement(userId, date, values);
    revalidatePath('/measurements');
    revalidatePath('/dashboard');
}

export async function deleteMeasurementAction(id: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user)
        return;
    await deleteMeasurement(user.id, id);
    revalidatePath('/measurements');
    revalidatePath('/dashboard');
}
