'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { deleteCalories, setCalories } from '@/services/caloriesService';

export async function setCaloriesAction(userId: string, date: string, value: number): Promise<void> {
    await setCalories(userId, date, value);
    revalidatePath('/calories');
    revalidatePath('/dashboard');
}

export async function deleteCaloriesAction(id: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user)
        return;
    await deleteCalories(user.id, id);
    revalidatePath('/calories');
    revalidatePath('/dashboard');
}
