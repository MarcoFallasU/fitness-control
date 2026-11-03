'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Flag, ArrowRight, Plus, SkipForward } from 'lucide-react';
import { updateExecutionExercisesAction, finalizeExecutionAction } from '@/app/(app)/exercises/actions';
import { computeExerciseVolume } from '@/lib/exercises-utils';
import { usePartnerSync } from '@/lib/use-partner-sync';
import { getPreferences } from '@/lib/preferences';
import { RestTimer } from '@/components/exercises/rest-timer';
import { AddExercisePanel } from '@/components/exercises/add-exercise-panel';
import { Spinner } from '@/components/ui/spinner';
import { LiquidBubble, useLiquidBubble } from '@/components/ui/liquid-bubble';
import { useBusy } from '@/lib/use-busy';
import type { RoutineExecution, ExerciseExecution, KnownExercise, SetDetail, User } from '@/lib/types';

function newExerciseId(): string {
    return `added-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SessionViewProps {
    execution: RoutineExecution;
    me: User;
}

type Mode = 'simple' | 'advanced';

// Next exercise after `from` that is not done yet, wrapping around; -1 when none is left.
function nextPendingFrom(list: { done?: boolean }[], from: number): number {
    for (let step = 1; step < list.length; step++) {
        const i = (from + step) % list.length;
        if (!list[i].done)
            return i;
    }
    return -1;
}

function withSetDetails(ex: ExerciseExecution): ExerciseExecution & { setDetails: SetDetail[] } {
    const details = ex.setDetails && ex.setDetails.length === ex.sets
        ? ex.setDetails
        : Array.from({ length: Math.max(1, ex.sets) }, () => ({ reps: ex.reps, weight: ex.weight }));
    return { ...ex, done: ex.done ?? false, setDetails: details };
}

export function SessionView({ execution, me }: SessionViewProps) {
    const router = useRouter();
    const [exercises, setExercises] = useState(() => execution.exercises.map(withSetDetails));
    const [index, setIndex] = useState(0);
    const [mode, setMode] = useState<Mode>('simple');
    const [finishing, setFinishing] = useState(false);
    const [adding, setAdding] = useState(false);
    // "Finalizar" ends the session for good, so it takes a second tap within a few seconds.
    const [confirmFinish, setConfirmFinish] = useState(false);
    const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chipRow = useRef<HTMLDivElement>(null);
    const { run, isBusy } = useBusy();
    const modeRef = useRef<HTMLDivElement>(null);
    const modeBubble = useLiquidBubble(modeRef, mode);

    const { partner, sendUpdate } = usePartnerSync(execution.routineId, me);
    useEffect(() => {
        sendUpdate({ routineName: execution.routineName, exercises, index });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercises, index]);

    const exercisesRef = useRef(exercises);
    useEffect(() => {
        exercisesRef.current = exercises;
    }, [exercises]);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    function scheduleSave() {
        if (saveTimer.current)
            clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            updateExecutionExercisesAction(execution.id, exercisesRef.current);
        }, 600);
    }
    async function saveNow() {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        await updateExecutionExercisesAction(execution.id, exercisesRef.current);
    }

    useEffect(() => () => {
        if (confirmTimer.current)
            clearTimeout(confirmTimer.current);
    }, []);

    // Keep the current exercise's chip in view as the user moves through a long routine.
    useEffect(() => {
        const row = chipRow.current;
        const chip = row?.children[index] as HTMLElement | undefined;
        if (!row || !chip)
            return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }, [index, exercises.length]);

    const total = exercises.length;
    const current = exercises[index];
    const doneCount = exercises.filter((e) => e.done).length;

    function updateCurrent(patch: Partial<ExerciseExecution & { setDetails: SetDetail[] }>) {
        setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    }

    // Simple mode treats every set alike, so the per-set details are rebuilt from the three numbers.
    // Without this the two views drift apart and the saved record (records, summary) reads stale values.
    function applySimple(field: 'sets' | 'reps' | 'weight', value: number) {
        const next = { sets: current.sets, reps: current.reps, weight: current.weight, [field]: value };
        updateCurrent({
            ...next,
            setDetails: Array.from({ length: Math.max(1, next.sets) }, () => ({ reps: next.reps, weight: next.weight })),
        });
        scheduleSave();
    }

    function stepField(field: 'sets' | 'reps' | 'weight', delta: number) {
        const min = field === 'weight' ? 0 : 1;
        applySimple(field, Math.max(min, +((current[field] ?? 0) + delta).toFixed(1)));
    }

    function typeField(field: 'sets' | 'reps' | 'weight', raw: string) {
        const value = parseFloat(raw);
        applySimple(field, isNaN(value) ? 0 : value);
    }

    // Advanced edits keep the summary numbers (top weight, average reps) in step with the sets.
    function typeSetDetail(setIdx: number, field: 'reps' | 'weight', raw: string) {
        const value = parseFloat(raw);
        const nextDetails = current.setDetails.map((s, i) => (i === setIdx ? { ...s, [field]: isNaN(value) ? 0 : value } : s));
        updateCurrent({
            setDetails: nextDetails,
            weight: Math.max(...nextDetails.map((d) => d.weight)),
            reps: Math.round(nextDetails.reduce((acc, d) => acc + d.reps, 0) / nextDetails.length),
        });
        scheduleSave();
    }

    function selectExercise(i: number) {
        setIndex(i);
        setMode('simple');
    }

    async function toggleDone() {
        updateCurrent({ done: !current.done });
        await saveNow();
    }

    // Only exercises marked as done are recorded when the session ends; everything else is dropped.
    async function finishExercise() {
        const nextExercises = exercises.map((e, i) => (i === index ? { ...e, done: true } : e));
        setExercises(nextExercises);
        const nextPending = nextPendingFrom(nextExercises, index);
        if (nextPending !== -1)
            setIndex(nextPending);
        setMode('simple');
        exercisesRef.current = nextExercises;
        if (getPreferences().vibrate)
            navigator.vibrate?.(15);
        await saveNow();
    }

    // Adds an exercise the user already has on record. It only lives in this session, not in the routine.
    async function addExercise(item: KnownExercise) {
        const sets = Math.max(1, item.sets);
        const added = withSetDetails({
            exerciseId: newExerciseId(),
            exerciseName: item.name,
            muscleGroup: item.muscleGroup,
            sets,
            reps: item.reps,
            weight: item.weight,
            done: false,
            targetSets: sets,
            targetReps: item.reps,
            targetWeight: item.weight,
        });
        const next = [...exercises, added];
        setExercises(next);
        exercisesRef.current = next;
        setIndex(next.length - 1);
        setMode('simple');
        setAdding(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await saveNow();
    }

    function skipExercise() {
        const nextPending = nextPendingFrom(exercises, index);
        selectExercise(nextPending === -1 ? (index + 1) % total : nextPending);
    }

    async function handleExit() {
        await saveNow();
        router.push('/exercises');
    }

    // Start time lives in localStorage (the DB only stores the date), so a reload does not reset the clock.
    const startKey = `session-start:${execution.id}`;
    useEffect(() => {
        try {
            if (!localStorage.getItem(startKey))
                localStorage.setItem(startKey, String(Date.now()));
        }
        catch { }
    }, [startKey]);

    async function handleFinish() {
        setFinishing(true);
        let seconds: number | undefined;
        try {
            const started = parseInt(localStorage.getItem(startKey) ?? '', 10);
            if (!isNaN(started))
                seconds = Math.max(0, Math.round((Date.now() - started) / 1000));
            localStorage.removeItem(startKey);
            localStorage.removeItem(`rest-timer:${execution.id}`);
        }
        catch { }
        const anyDone = exercisesRef.current.some((e) => e.done);
        await finalizeExecutionAction(execution.id, exercisesRef.current);
        // A session with nothing marked as done is discarded, so there is no summary to show.
        router.push(anyDone ? `/session/${execution.id}/summary${seconds !== undefined ? `?t=${seconds}` : ''}` : '/exercises');
    }

    function requestFinish() {
        if (confirmTimer.current)
            clearTimeout(confirmTimer.current);
        if (confirmFinish) {
            setConfirmFinish(false);
            void handleFinish();
            return;
        }
        setConfirmFinish(true);
        confirmTimer.current = setTimeout(() => setConfirmFinish(false), 3000);
    }

    const nextPendingIdx = exercises.findIndex((e, i) => i !== index && !e.done);
    const volume = current ? computeExerciseVolume(current) : 0;

    const fieldClass = 'field-value';
    // 44px is the smallest target a thumb can hit reliably between sets.
    const stepperBtnClass = 'press flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-white/[0.08] text-xl font-bold leading-none text-foreground';
    const setInputClass = 'h-11 w-[4.5rem] rounded-xl border border-border bg-white/[0.07] px-1.5 text-center text-base font-bold tabular-nums text-foreground outline-none focus:border-ring';

    return (<div className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 pt-6 sm:px-8">
        <div className="flex items-center justify-between">
          <button disabled={isBusy('exit')} onClick={() => run('exit', async () => { await handleExit(); return 'keep'; })} className="press -m-2 flex items-center gap-1.5 p-2 text-sm font-semibold text-muted-foreground disabled:opacity-70">
            {isBusy('exit') ? <Spinner/> : <ArrowLeft className="size-4"/>}
            Salir
          </button>
          <span className="font-mono text-xs font-bold text-muted-foreground">
            Ejercicio <b className="text-brand">{index + 1}</b>/{total}
          </span>
        </div>

        {/* One segment per exercise: finished, the one you are on, and what is left. */}
        <div role="progressbar" aria-label="Ejercicios terminados" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} className="mt-4 flex gap-1">
          {exercises.map((ex, i) => (<div key={ex.exerciseId} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${ex.done ? 'bg-brand' : i === index ? 'bg-white/55' : 'bg-white/[0.12]'}`}/>))}
        </div>

        {partner && (() => {
            const pCurrent = partner.exercises[partner.index];
            const pDone = partner.exercises.filter((e) => e.done).length;
            return (<div className="glass mt-4 flex items-center gap-3 rounded-2xl p-3">
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold text-ink" style={{ backgroundColor: partner.color }}>
                {partner.displayName[0]}
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-[var(--lime)]"/>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground">
                  {partner.displayName} · en vivo · {pDone}/{partner.exercises.length}
                </p>
                {pCurrent ? (<p className="truncate text-sm font-bold">
                    {pCurrent.exerciseName} <span className="font-normal text-muted-foreground">· {pCurrent.sets}×{pCurrent.reps} · {pCurrent.weight}kg</span>
                  </p>) : (<p className="text-sm text-muted-foreground">Sin ejercicios</p>)}
              </div>
            </div>);
        })()}

        {current ? (<>
          <div key={`title-${current.exerciseId}`} className="animate-rise mt-6">
            <p className="mb-1.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand">
              {current.muscleGroup}
            </p>
            <h1 className="text-balance font-heading text-3xl font-extrabold leading-[1.05] tracking-[-0.02em]">
              {current.exerciseName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Objetivo: {current.targetSets} × {current.targetReps} · {current.targetWeight} kg
            </p>
            {current.done && (<button disabled={isBusy('toggle')} onClick={() => run('toggle', toggleDone)} className="mt-2.5 disabled:opacity-70 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(143,224,168,.14)', borderColor: 'rgba(143,224,168,.4)', color: 'var(--lime)' }}>
                {isBusy('toggle') ? <Spinner className="size-3.5"/> : <Check className="size-3.5"/>}
                Completado · Toca para desmarcar
              </button>)}
          </div>

          <div ref={modeRef} className="relative mt-4 flex rounded-xl border border-border bg-white/[0.06] p-[3px]">
            <LiquidBubble box={modeBubble} radius={9}/>
            <button data-lg-item="simple" onClick={() => setMode('simple')} className={`relative flex-1 rounded-lg py-2 text-xs font-bold ${mode === 'simple' ? 'text-white' : 'text-muted-foreground'}`}>
              Simple
            </button>
            <button data-lg-item="advanced" onClick={() => setMode('advanced')} className={`relative flex-1 rounded-lg py-2 text-xs font-bold ${mode === 'advanced' ? 'text-white' : 'text-muted-foreground'}`}>
              Avanzado
            </button>
          </div>

          <div key={`values-${current.exerciseId}`} className="animate-rise">
          {mode === 'simple' ? (<div className="glass mt-3.5 grid grid-cols-3 gap-2 rounded-2xl p-1.5">
              {([
                { key: 'sets', label: 'Series', delta: 1 },
                { key: 'reps', label: 'Reps', delta: 1 },
                { key: 'weight', label: 'Peso (kg)', delta: 2.5 },
            ] as const).map((f) => (<div key={f.key} className="flex flex-col items-center gap-2.5 rounded-2xl p-2.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {f.label}
                  </label>
                  <input type="number" inputMode="decimal" className={fieldClass} value={current[f.key]} onChange={(e) => typeField(f.key, e.target.value)} onFocus={(e) => e.target.select()}/>
                  <div className="flex w-full items-center gap-1.5">
                    <button type="button" aria-label={`Menos ${f.label}`} className={stepperBtnClass} onClick={() => stepField(f.key, -f.delta)}>−</button>
                    <button type="button" aria-label={`Más ${f.label}`} className={stepperBtnClass} onClick={() => stepField(f.key, f.delta)}>+</button>
                  </div>
                </div>))}
            </div>) : (<div className="glass mt-3.5 rounded-2xl p-3.5">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="pb-1.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Serie</th>
                    <th className="pb-1.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Reps</th>
                    <th className="pb-1.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {current.setDetails.map((s, i) => (<tr key={i}>
                      <td className="py-1 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="py-1">
                        <input type="number" inputMode="decimal" aria-label={`Reps de la serie ${i + 1}`} value={s.reps} onChange={(e) => typeSetDetail(i, 'reps', e.target.value)} onFocus={(e) => e.target.select()} className={setInputClass}/>
                      </td>
                      <td className="py-1">
                        <input type="number" inputMode="decimal" aria-label={`Peso de la serie ${i + 1}`} value={s.weight} onChange={(e) => typeSetDetail(i, 'weight', e.target.value)} onFocus={(e) => e.target.select()} className={setInputClass}/>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}

          <p className="mt-3.5 text-xs text-muted-foreground">
            Volumen del ejercicio: <span className="font-bold text-foreground">{volume.toLocaleString('es')} kg</span>
          </p>
          </div>

          <RestTimer storageKey={`rest-timer:${execution.id}`}/>

          <div className="mt-4 flex items-start gap-2">
            <div ref={chipRow} className="relative flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {exercises.map((ex, i) => (<button key={ex.exerciseId} onClick={() => selectExercise(i)} aria-current={i === index} className={`press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2.5 text-xs font-bold ${i === index
                      ? 'border-brand bg-brand text-brand-foreground'
                      : ex.done
                          ? 'border-border bg-white/[0.06] text-[var(--lime)]'
                          : 'border-border bg-white/[0.06] text-muted-foreground'}`}>
                  {ex.done ? '✓ ' : ''}{ex.exerciseName}
                </button>))}
            </div>
            {/* Outside the scrolling row so it is always visible, however many exercises there are. */}
            <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className={`press flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-2.5 text-xs font-bold ${adding ? 'border-brand text-foreground' : 'border-dashed border-border text-muted-foreground'}`}>
              <Plus className="size-3.5"/>Agregar
            </button>
          </div>
          {adding && <AddExercisePanel existingNames={exercises.map((e) => e.exerciseName)} onPick={addExercise} onClose={() => setAdding(false)}/>}
        </>) : (<p className="mt-10 text-center text-sm text-muted-foreground">Esta rutina no tiene ejercicios.</p>)}
      </div>

      {/* Pinned to the bottom so the main action is always under the thumb, however far the page is scrolled. */}
      {current && (<div className="sticky bottom-0 z-20 border-t border-white/[0.14] bg-black/35 backdrop-blur-2xl">
          <div className="mx-auto max-w-lg px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
            <p className="mb-2 text-center text-xs text-muted-foreground">
              Se registrarán <span className="font-bold text-foreground">{doneCount}</span> de {total} ejercicios (solo los terminados)
            </p>
            <div className="flex gap-2.5">
              <button onClick={requestFinish} disabled={finishing} aria-live="polite" className={`press shrink-0 rounded-2xl border px-4 text-sm font-bold transition-colors disabled:opacity-60 ${confirmFinish ? 'border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]' : 'border-border text-muted-foreground'}`}>
                <span className="flex items-center gap-1.5">{finishing ? <Spinner/> : <Flag className="size-4"/>}{confirmFinish ? (doneCount > 0 ? `Registrar ${doneCount}` : 'Descartar') : 'Finalizar'}</span>
              </button>
              {current.done ? (<button onClick={skipExercise} className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-heading text-sm font-extrabold text-brand-foreground">
                  Siguiente ejercicio <ArrowRight className="size-4"/>
                </button>) : (<>
                  {nextPendingIdx !== -1 && (<button onClick={skipExercise} aria-label="Saltar este ejercicio sin registrarlo" title="Saltar sin registrar" className="press flex w-12 shrink-0 items-center justify-center rounded-2xl border border-border text-muted-foreground">
                      <SkipForward className="size-5"/>
                    </button>)}
                  <button disabled={isBusy('next')} onClick={() => run('next', finishExercise)} className="press flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-brand py-3.5 font-heading text-sm font-extrabold text-brand-foreground disabled:opacity-70">
                    {isBusy('next') ? <Spinner/> : <Check className="size-4"/>} Terminar ejercicio
                  </button>
                </>)}
            </div>
          </div>
        </div>)}

    </div>);
}
