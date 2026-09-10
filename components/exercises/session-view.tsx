'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Flag, ArrowRight } from 'lucide-react';
import { updateExecutionExercisesAction, finalizeExecutionAction } from '@/app/(app)/exercises/actions';
import { computeExerciseVolume } from '@/lib/exercises-utils';
import { usePartnerSync } from '@/lib/use-partner-sync';
import type { RoutineExecution, ExerciseExecution, SetDetail, User } from '@/lib/types';

interface SessionViewProps {
    execution: RoutineExecution;
    me: User;
}

type Mode = 'simple' | 'advanced';

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

    const total = exercises.length;
    const current = exercises[index];
    const doneCount = exercises.filter((e) => e.done).length;

    function updateCurrent(patch: Partial<ExerciseExecution & { setDetails: SetDetail[] }>) {
        setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    }

    function stepField(field: 'sets' | 'reps' | 'weight', delta: number) {
        const min = field === 'weight' ? 0 : 1;
        const value = Math.max(min, +((current[field] ?? 0) + delta).toFixed(1));
        updateCurrent({ [field]: value } as Partial<ExerciseExecution>);
        scheduleSave();
    }

    function typeField(field: 'sets' | 'reps' | 'weight', raw: string) {
        const value = parseFloat(raw);
        updateCurrent({ [field]: isNaN(value) ? 0 : value } as Partial<ExerciseExecution>);
        scheduleSave();
    }

    function typeSetDetail(setIdx: number, field: 'reps' | 'weight', raw: string) {
        const value = parseFloat(raw);
        const nextDetails = current.setDetails.map((s, i) => (i === setIdx ? { ...s, [field]: isNaN(value) ? 0 : value } : s));
        updateCurrent({ setDetails: nextDetails });
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

    async function goNext() {
        const nextExercises = exercises.map((e, i) => (i === index ? { ...e, done: true } : e));
        setExercises(nextExercises);
        const nextPending = nextExercises.findIndex((e) => !e.done);
        setIndex(nextPending === -1 ? (index + 1) % total : nextPending);
        setMode('simple');
        exercisesRef.current = nextExercises;
        await saveNow();
    }

    async function handleExit() {
        await saveNow();
        router.push('/exercises');
    }

    async function handleFinish() {
        setFinishing(true);
        await finalizeExecutionAction(execution.id, exercisesRef.current);
        router.push('/exercises');
    }

    // Draggable peek sheet
    const sheetRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const PEEK_OFFSET = 76;

    useLayoutEffect(() => {
        const sheet = sheetRef.current, handle = handleRef.current, backdrop = backdropRef.current;
        if (!sheet || !handle || !backdrop)
            return;

        let dragging = false, movedWhileDragging = false, startY = 0, startTranslate = 0, open = false;
        const closedTranslate = () => sheet!.offsetHeight - handle!.offsetHeight - PEEK_OFFSET;

        function setOpen(val: boolean) {
            open = val;
            sheet!.style.transform = `translateY(${open ? 0 : closedTranslate()}px)`;
            backdrop!.classList.toggle('show', open);
        }
        // Set the initial position without animating in from "open".
        sheet.classList.add('dragging');
        setOpen(false);
        requestAnimationFrame(() => sheet!.classList.remove('dragging'));

        function setTranslate(y: number) {
            const clamped = Math.max(0, Math.min(closedTranslate(), y));
            sheet!.style.transform = `translateY(${clamped}px)`;
            backdrop!.classList.toggle('show', clamped < closedTranslate() * 0.85);
        }
        function currentTranslateY(): number {
            const m = /translateY\(([-\d.]+)px\)/.exec(sheet!.style.transform);
            return m ? parseFloat(m[1]) : closedTranslate();
        }
        function snap() {
            sheet!.classList.remove('dragging');
            setOpen(currentTranslateY() < closedTranslate() / 2);
        }
        function onPointerDown(e: PointerEvent) {
            dragging = true; movedWhileDragging = false; startY = e.clientY;
            startTranslate = open ? 0 : closedTranslate();
            sheet!.classList.add('dragging');
            handle!.setPointerCapture(e.pointerId);
        }
        function onPointerMove(e: PointerEvent) {
            if (!dragging)
                return;
            if (Math.abs(e.clientY - startY) > 3)
                movedWhileDragging = true;
            setTranslate(startTranslate + (e.clientY - startY));
        }
        function onPointerUp() {
            if (!dragging)
                return;
            dragging = false;
            if (movedWhileDragging)
                snap();
            else
                setOpen(!open);
        }
        function onBackdropClick() {
            setOpen(false);
        }
        function onResize() {
            setOpen(open);
        }

        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('pointermove', onPointerMove);
        handle.addEventListener('pointerup', onPointerUp);
        backdrop.addEventListener('click', onBackdropClick);
        window.addEventListener('resize', onResize);
        return () => {
            handle.removeEventListener('pointerdown', onPointerDown);
            handle.removeEventListener('pointermove', onPointerMove);
            handle.removeEventListener('pointerup', onPointerUp);
            backdrop.removeEventListener('click', onBackdropClick);
            window.removeEventListener('resize', onResize);
        };
    }, [total]);

    const nextPendingIdx = exercises.findIndex((e, i) => i !== index && !e.done);
    const volume = current ? computeExerciseVolume(current) : 0;

    const fieldClass = 'field-value';
    const stepperBtnClass = 'flex size-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/[0.08] text-foreground';

    return (<div className="relative min-h-screen pb-6">
      <div className="mx-auto flex max-w-lg flex-col px-5 pt-6 sm:px-8">
        <div className="flex items-center justify-between">
          <button onClick={handleExit} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <ArrowLeft className="size-4"/>
            Salir
          </button>
          <span className="font-mono text-xs font-bold text-muted-foreground">
            Ejercicio <b className="text-brand">{index + 1}</b>/{total}
          </span>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}/>
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
          <div className="mt-6">
            <p className="mb-1.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand">
              {current.muscleGroup}
            </p>
            <h1 className="text-balance font-heading text-3xl font-extrabold leading-tight">
              {current.exerciseName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Objetivo: {current.targetSets} × {current.targetReps} · {current.targetWeight} kg
            </p>
            {current.done && (<button onClick={toggleDone} className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(143,224,168,.14)', borderColor: 'rgba(143,224,168,.4)', color: 'var(--lime)' }}>
                <Check className="size-3.5"/>
                Completado · Toca para desmarcar
              </button>)}
          </div>

          <div className="mt-4 flex rounded-xl border border-border bg-white/[0.06] p-[3px]">
            <button onClick={() => setMode('simple')} className={`flex-1 rounded-lg py-2 text-xs font-bold ${mode === 'simple' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground'}`}>
              Simple
            </button>
            <button onClick={() => setMode('advanced')} className={`flex-1 rounded-lg py-2 text-xs font-bold ${mode === 'advanced' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground'}`}>
              Avanzado
            </button>
          </div>

          {mode === 'simple' ? (<div className="glass mt-3.5 grid grid-cols-3 gap-2 rounded-2xl p-1.5">
              {([
                { key: 'sets', label: 'Series', delta: 1 },
                { key: 'reps', label: 'Reps', delta: 1 },
                { key: 'weight', label: 'Peso (kg)', delta: 2.5 },
            ] as const).map((f) => (<div key={f.key} className="flex flex-col items-center gap-2.5 rounded-2xl p-3.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {f.label}
                  </label>
                  <input type="number" inputMode="decimal" className={fieldClass} value={current[f.key]} onChange={(e) => typeField(f.key, e.target.value)} onFocus={(e) => e.target.select()}/>
                  <div className="flex items-center justify-center gap-3.5">
                    <button type="button" className={stepperBtnClass} onClick={() => stepField(f.key, -f.delta)}>−</button>
                    <button type="button" className={stepperBtnClass} onClick={() => stepField(f.key, f.delta)}>+</button>
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
                        <input type="number" value={s.reps} onChange={(e) => typeSetDetail(i, 'reps', e.target.value)} onFocus={(e) => e.target.select()} className="w-14 rounded-lg border border-border bg-white/[0.07] px-1.5 py-1 text-center text-sm font-bold tabular-nums text-foreground outline-none focus:border-ring"/>
                      </td>
                      <td className="py-1">
                        <input type="number" value={s.weight} onChange={(e) => typeSetDetail(i, 'weight', e.target.value)} onFocus={(e) => e.target.select()} className="w-14 rounded-lg border border-border bg-white/[0.07] px-1.5 py-1 text-center text-sm font-bold tabular-nums text-foreground outline-none focus:border-ring"/>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}

          <p className="mt-3.5 text-xs text-muted-foreground">
            Volumen de esta serie: <span className="font-bold text-foreground">{volume.toLocaleString('es')} kg</span>
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {exercises.map((ex, i) => (<button key={ex.exerciseId} onClick={() => selectExercise(i)} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-bold ${i === index
                    ? 'border-brand bg-brand text-brand-foreground'
                    : ex.done
                        ? 'border-border bg-white/[0.06] text-[var(--lime)]'
                        : 'border-border bg-white/[0.06] text-muted-foreground'}`}>
                {ex.done ? '✓ ' : ''}{ex.exerciseName}
              </button>))}
          </div>
        </>) : (<p className="mt-10 text-center text-sm text-muted-foreground">Esta rutina no tiene ejercicios.</p>)}
      </div>

      {current && (<div className="mx-auto mt-6 flex max-w-lg gap-2.5 px-5 sm:px-8" style={{ paddingBottom: PEEK_OFFSET + 76 }}>
          <button onClick={handleFinish} disabled={finishing} className="shrink-0 rounded-2xl border border-border px-4 text-sm font-bold text-muted-foreground disabled:opacity-60">
            <span className="flex items-center gap-1.5"><Flag className="size-4"/>Terminar</span>
          </button>
          <button onClick={goNext} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-heading text-sm font-extrabold text-brand-foreground">
            Siguiente ejercicio <ArrowRight className="size-4"/>
          </button>
        </div>)}

      {current && (<>
          <div ref={backdropRef} className="session-scrim"/>
          <div ref={sheetRef} className="glass-nav session-sheet fixed inset-x-0 bottom-0 z-50 rounded-t-3xl" style={{ height: '70%' }}>
            <div ref={handleRef} className="flex cursor-grab flex-col items-center gap-2 py-3">
              <div className="h-1 w-9 rounded-full bg-white/30"/>
              <span className="text-xs font-bold text-muted-foreground">{execution.routineName} · {total} ejercicios</span>
            </div>

            {nextPendingIdx !== -1 && (<div className="px-5 pb-2.5">
                <button onClick={() => selectExercise(nextPendingIdx)} className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/[0.04] p-3 text-left">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-extrabold">
                    {nextPendingIdx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">Siguiente: {exercises[nextPendingIdx].exerciseName}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {exercises[nextPendingIdx].muscleGroup} · {exercises[nextPendingIdx].sets}×{exercises[nextPendingIdx].reps} · {exercises[nextPendingIdx].weight}kg
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground"/>
                </button>
              </div>)}

            <div className="flex flex-col gap-2 overflow-y-auto px-5 pb-5" style={{ height: 'calc(100% - 130px)' }}>
              {exercises.map((ex, i) => (<button key={ex.exerciseId} onClick={() => selectExercise(i)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${i === index ? 'border-brand bg-brand/10' : 'border-transparent bg-white/[0.04]'}`}>
                  <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${ex.done ? 'bg-[var(--lime)] text-ink' : i === index ? 'bg-brand text-brand-foreground' : 'bg-white/[0.08]'}`}>
                    {ex.done ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{ex.exerciseName}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {ex.muscleGroup} · {ex.sets}×{ex.reps} · {ex.weight}kg
                    </span>
                  </span>
                  <span className={`shrink-0 text-[11px] font-bold ${ex.done ? 'text-[var(--lime)]' : 'text-muted-foreground/60'}`}>
                    {ex.done ? 'Hecho' : (i === index ? 'Actual' : '')}
                  </span>
                </button>))}
            </div>
          </div>
        </>)}
    </div>);
}
