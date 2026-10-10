'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { sanitizeSharedRoutine } from '@/lib/share-routine';
import * as svc from '@/services/exercisesService';

export async function importSharedRoutineAction(formData: FormData): Promise<void> {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    // The routine arrives edited from the browser, so it is re-validated here.
    let raw: unknown = null;
    try {
        raw = JSON.parse(String(formData.get('payload') ?? ''));
    }
    catch {
        raw = null;
    }
    const shared = sanitizeSharedRoutine(raw);
    if (!shared)
        redirect('/exercises');
    const routine = await svc.createRoutine(me.id, { name: shared.name, description: shared.description, days: [] });
    for (const ex of shared.exercises) {
        await svc.addExercise(routine.id, ex);
    }
    revalidatePath('/exercises');
    revalidatePath('/dashboard');
    redirect('/exercises');
}
