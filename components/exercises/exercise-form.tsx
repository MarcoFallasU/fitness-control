'use client';
import { useState } from 'react';
import { Modal } from '@/components/modal';
import { addExerciseAction, updateExerciseAction } from '@/app/(app)/exercises/actions';
import type { Exercise } from '@/lib/types';
interface ExerciseFormProps {
    routineId: string;
    exercise?: Exercise;
    onClose: () => void;
    onSaved: () => void;
}
const MUSCLE_GROUPS = [
    'Pecho',
    'Espalda',
    'Hombros',
    'Bíceps',
    'Tríceps',
    'Pierna',
    'Glúteo',
    'Core',
    'Full body',
];
export function ExerciseForm({ routineId, exercise, onClose, onSaved }: ExerciseFormProps) {
    const [name, setName] = useState(exercise?.name ?? '');
    const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? MUSCLE_GROUPS[0]);
    const [sets, setSets] = useState(String(exercise?.sets ?? 4));
    const [reps, setReps] = useState(String(exercise?.reps ?? 10));
    const [weight, setWeight] = useState(String(exercise?.weight ?? 20));
    const [notes, setNotes] = useState(exercise?.notes ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('El ejercicio necesita un nombre.');
            return;
        }
        const payload = {
            name: name.trim(),
            muscleGroup,
            sets: Math.max(1, Number(sets) || 1),
            reps: Math.max(1, Number(reps) || 1),
            weight: Math.max(0, Number(weight) || 0),
            notes: notes.trim() || undefined,
        };
        setSaving(true);
        if (exercise) {
            await updateExerciseAction(routineId, exercise.id, payload);
        }
        else {
            await addExerciseAction(routineId, payload);
        }
        setSaving(false);
        onSaved();
    }
    const fieldClass = 'rounded-md border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-ring';
    const labelClass = 'font-mono text-xs uppercase tracking-widest text-muted-foreground';
    return (<Modal eyebrow={exercise ? 'Editar' : 'Nuevo'} title={exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="ename" className={labelClass}>
            Nombre
          </label>
          <input id="ename" value={name} onChange={(e) => setName(e.target.value)} placeholder="Press banca" className={fieldClass}/>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="mg" className={labelClass}>
            Grupo muscular
          </label>
          <select id="mg" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} className={fieldClass}>
            {MUSCLE_GROUPS.map((g) => (<option key={g} value={g}>
                {g}
              </option>))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="sets" className={labelClass}>
              Series
            </label>
            <input id="sets" type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} className={fieldClass}/>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="reps" className={labelClass}>
              Reps
            </label>
            <input id="reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} className={fieldClass}/>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="weight" className={labelClass}>
              Peso (kg)
            </label>
            <input id="weight" type="number" min="0" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className={fieldClass}/>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="enotes" className={labelClass}>
            Notas (opcional)
          </label>
          <input id="enotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Técnica, tempo, sensaciones…" className={fieldClass}/>
        </div>

        {error && (<p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>)}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border px-5 py-3 font-heading text-base uppercase tracking-wide transition-colors hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>);
}
