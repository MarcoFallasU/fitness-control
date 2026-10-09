import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Dumbbell, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { decodeSharedRoutine } from '@/lib/share-routine';
import { SubmitButton } from '@/components/ui/submit-button';
import { importSharedRoutineAction } from './actions';

export default async function SharedRoutinePage({ searchParams }: {
    searchParams: Promise<{ d?: string }>;
}) {
    const { d } = await searchParams;
    const me = await getCurrentUser();
    if (!me)
        redirect(`/login?next=${encodeURIComponent(`/share/routine?d=${d ?? ''}`)}`);
    const routine = decodeSharedRoutine(d);

    if (!routine) {
        return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <h1 className="font-heading text-xl font-extrabold">Enlace no válido</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta rutina compartida está dañada o incompleta.</p>
          <Link href="/exercises" className="bg-brand mt-6 inline-flex rounded-full px-5 py-3 text-sm font-extrabold">Ir a mis rutinas</Link>
        </div>
      </main>);
    }

    return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Rutina compartida</p>
        <h1 className="mt-1 text-balance font-heading text-2xl font-extrabold leading-tight">{routine.name}</h1>
        {routine.description && <p className="mt-2 text-sm text-muted-foreground">{routine.description}</p>}

        <ul className="mt-5 divide-y divide-[var(--glass-border)]">
          {routine.exercises.map((ex, i) => (<li key={i} className="flex items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10"><Dumbbell className="size-4"/></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{ex.name}</p>
                <p className="text-[11px] text-muted-foreground">{ex.muscleGroup} · {ex.sets}×{ex.reps} · {ex.weight} kg</p>
              </div>
            </li>))}
          {routine.exercises.length === 0 && <li className="py-3 text-sm text-muted-foreground">Sin ejercicios.</li>}
        </ul>

        <form action={importSharedRoutineAction} className="mt-6 flex gap-2.5">
          <input type="hidden" name="d" value={d}/>
          <Link href="/exercises" className="flex items-center rounded-full border border-border px-5 text-sm font-bold text-muted-foreground">Cancelar</Link>
          <SubmitButton className="bg-brand flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-heading text-sm font-extrabold">
            <Plus className="size-4"/>Añadir a mis rutinas
          </SubmitButton>
        </form>
      </div>
    </main>);
}
