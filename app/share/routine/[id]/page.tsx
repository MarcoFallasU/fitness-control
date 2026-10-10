import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getRoutine } from '@/services/exercisesService';
import { SharedRoutineEditor } from '@/components/share/shared-routine-editor';

export default async function SharedRoutinePage({ params }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me)
        redirect(`/login?next=${encodeURIComponent(`/share/routine/${id}`)}`);

    const routine = await getRoutine(id);
    if (!routine) {
        return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <h1 className="font-heading text-xl font-extrabold">Enlace no válido</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta rutina ya no existe o el enlace está incompleto.</p>
          <Link href="/exercises" className="bg-brand mt-6 inline-flex rounded-full px-5 py-3 text-sm font-extrabold">Ir a mis rutinas</Link>
        </div>
      </main>);
    }

    // Only the routine itself leaves the server: no owner, days, groups or history.
    return (<SharedRoutineEditor isOwn={routine.userId === me.id} routine={{
            name: routine.name,
            description: routine.description,
            exercises: routine.exercises.map((e) => ({
                name: e.name,
                muscleGroup: e.muscleGroup,
                sets: e.sets,
                reps: e.reps,
                weight: e.weight,
                notes: e.notes,
            })),
        }}/>);
}
