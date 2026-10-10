'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Dumbbell, Pencil, Plus, X } from 'lucide-react';
import { SubmitButton } from '@/components/ui/submit-button';
import { importSharedRoutineAction } from '@/app/share/routine/actions';
import { MUSCLE_GROUPS } from '@/lib/muscle-groups';
import type { SharedRoutine } from '@/lib/share-routine';

interface Row {
    key: number;
    name: string;
    muscleGroup: string;
    sets: string;
    reps: string;
    weight: string;
    notes?: string;
}

const fieldClass = 'w-full min-w-0 rounded-xl border border-input bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring';
const labelClass = 'font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground';

/** Read-only preview of a shared routine; the exercises only become editable when the user asks for it. */
export function SharedRoutineEditor({ routine, isOwn }: {
    routine: SharedRoutine;
    isOwn: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(routine.name);
    const [rows, setRows] = useState<Row[]>(() => routine.exercises.map((e, i) => ({
        key: i,
        name: e.name,
        muscleGroup: e.muscleGroup,
        sets: String(e.sets),
        reps: String(e.reps),
        weight: String(e.weight),
        notes: e.notes,
    })));

    function patch(key: number, changes: Partial<Row>) {
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...changes } : r)));
    }

    const payload = JSON.stringify({
        name,
        description: routine.description,
        exercises: rows.map((r) => ({
            name: r.name,
            muscleGroup: r.muscleGroup,
            sets: Number(r.sets) || 1,
            reps: Number(r.reps) || 1,
            weight: Number(r.weight) || 0,
            notes: r.notes,
        })),
    });
    const canImport = name.trim().length > 0 && rows.some((r) => r.name.trim().length > 0);

    return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Rutina compartida</p>
        {editing ? (<>
            <label htmlFor="routine-name" className="sr-only">Nombre de la rutina</label>
            <input id="routine-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={`${fieldClass} mt-2 font-heading text-xl font-extrabold`}/>
          </>) : (<h1 className="mt-1 text-balance font-heading text-2xl font-extrabold leading-tight">{name}</h1>)}
        {routine.description && <p className="mt-2 text-sm text-muted-foreground">{routine.description}</p>}
        {isOwn && (<p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-muted-foreground">
            Esta rutina es tuya: al añadirla se crea una copia.
          </p>)}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {editing ? 'Ajusta lo que necesites antes de añadirla.' : `${rows.length} ejercicios`}
          </p>
          <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
            {editing ? <Check className="size-3.5"/> : <Pencil className="size-3.5"/>}
            {editing ? 'Listo' : 'Editar'}
          </button>
        </div>

        {editing ? (<ul className="mt-2 divide-y divide-[var(--glass-border)]">
            {rows.map((row) => (<li key={row.key} className="flex flex-col gap-2 py-3">
                <div className="flex items-center gap-2">
                  <input aria-label="Nombre del ejercicio" value={row.name} onChange={(e) => patch(row.key, { name: e.target.value })} maxLength={80} className={`${fieldClass} font-bold`}/>
                  <button type="button" aria-label={`Quitar ${row.name || 'ejercicio'}`} onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-muted-foreground transition-colors hover:text-foreground">
                    <X className="size-4"/>
                  </button>
                </div>
                <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={labelClass}>Grupo</span>
                    <select aria-label="Grupo muscular" value={row.muscleGroup} onChange={(e) => patch(row.key, { muscleGroup: e.target.value })} className={fieldClass}>
                      {!MUSCLE_GROUPS.includes(row.muscleGroup) && <option value={row.muscleGroup}>{row.muscleGroup}</option>}
                      {MUSCLE_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={labelClass}>Series</span>
                    <input aria-label="Series" type="number" inputMode="numeric" min={1} value={row.sets} onChange={(e) => patch(row.key, { sets: e.target.value })} onFocus={(e) => e.target.select()} className={fieldClass}/>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={labelClass}>Reps</span>
                    <input aria-label="Repeticiones" type="number" inputMode="numeric" min={1} value={row.reps} onChange={(e) => patch(row.key, { reps: e.target.value })} onFocus={(e) => e.target.select()} className={fieldClass}/>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={labelClass}>Kg</span>
                    <input aria-label="Peso en kilos" type="number" inputMode="decimal" min={0} step="any" value={row.weight} onChange={(e) => patch(row.key, { weight: e.target.value })} onFocus={(e) => e.target.select()} className={fieldClass}/>
                  </div>
                </div>
              </li>))}
            {rows.length === 0 && <li className="py-3 text-sm text-muted-foreground">Quitaste todos los ejercicios.</li>}
          </ul>) : (<ul className="mt-2 divide-y divide-[var(--glass-border)]">
            {rows.map((row) => (<li key={row.key} className="flex items-center gap-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10"><Dumbbell className="size-4"/></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{row.name}</p>
                  <p className="text-[11px] text-muted-foreground">{row.muscleGroup} · {row.sets}×{row.reps} · {row.weight} kg</p>
                </div>
              </li>))}
            {rows.length === 0 && <li className="py-3 text-sm text-muted-foreground">Sin ejercicios.</li>}
          </ul>)}

        <form action={importSharedRoutineAction} className="mt-6 flex gap-2.5">
          <input type="hidden" name="payload" value={payload}/>
          <Link href="/exercises" className="flex items-center rounded-full border border-border px-5 text-sm font-bold text-muted-foreground">Cancelar</Link>
          <SubmitButton className={`bg-brand flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-heading text-sm font-extrabold ${canImport ? '' : 'pointer-events-none opacity-50'}`}>
            <Plus className="size-4"/>Añadir a mis rutinas
          </SubmitButton>
        </form>
      </div>
    </main>);
}
