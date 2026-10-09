'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { decodeSharedRoutine } from '@/lib/share-routine';
import * as svc from '@/services/exercisesService';

export async function importSharedRoutineAction(formData: FormData): Promise<void> {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    // Re-decode on the server: never trust a parsed routine coming from the client.
    const shared = decodeSharedRoutine(String(formData.get('d') ?? ''));
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
