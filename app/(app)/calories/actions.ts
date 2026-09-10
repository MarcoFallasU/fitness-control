'use server';
import { revalidatePath } from 'next/cache';
import { setCalories } from '@/services/caloriesService';

export async function setCaloriesAction(userId: string, date: string, value: number): Promise<void> {
    await setCalories(userId, date, value);
    revalidatePath('/calories');
    revalidatePath('/dashboard');
}
