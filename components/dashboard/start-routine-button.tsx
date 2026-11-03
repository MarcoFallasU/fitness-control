'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { startTrackingAction } from '@/app/(app)/exercises/actions';
import { Spinner } from '@/components/ui/spinner';
import { localISODate } from '@/lib/local-date';

const CLASS = 'press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--yellow)] py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--ink)] disabled:opacity-70';

/** Starts today's routine, or resumes it when a session for it is already running. */
export function StartRoutineButton({ userId, routineId, activeExecutionId }: {
  userId: string;
  routineId: string;
  activeExecutionId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (activeExecutionId)
    return (<Link href={`/session/${activeExecutionId}`} className={CLASS}>
      <Play className="size-4"/> Continuar rutina
    </Link>);

  async function start() {
    setBusy(true);
    try {
      const execution = await startTrackingAction(userId, routineId, localISODate());
      if (execution) {
        router.push(`/session/${execution.id}`);
        return;
      }
    }
    catch { }
    setBusy(false);
  }

  return (<button type="button" onClick={start} disabled={busy} className={CLASS}>
    {busy ? <Spinner/> : <Play className="size-4"/>} Empezar rutina
  </button>);
}
