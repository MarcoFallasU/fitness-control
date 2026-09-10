'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/modal';
import { createRoutineAction, updateRoutineAction, deleteRoutineAction, createRoutineGroupAction, } from '@/app/(app)/exercises/actions';
import type { Routine, RoutineGroup } from '@/lib/types';
interface RoutineFormProps {
    userId: string;
    routine?: Routine;
    executionCount?: number;
    initialGroups: RoutineGroup[];
    onClose: () => void;
    onSaved: () => void;
}
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export function RoutineForm({ userId, routine, executionCount = 0, initialGroups, onClose, onSaved }: RoutineFormProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    async function handleDelete() {
        if (!routine)
            return;
        setDeleting(true);
        await deleteRoutineAction(routine.id);
        setDeleting(false);
        onSaved();
    }
    const [name, setName] = useState(routine?.name ?? '');
    const [description, setDescription] = useState(routine?.description ?? '');
    const [days, setDays] = useState<string[]>(routine?.days ?? []);
    const [groups, setGroups] = useState<RoutineGroup[]>(initialGroups);
    const [groupIds, setGroupIds] = useState<string[]>(routine?.groupIds ?? []);
    const [newGroup, setNewGroup] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    function toggleDay(day: string) {
        setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    }
    function toggleGroup(id: string) {
        setGroupIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
    }
    async function handleAddGroup() {
        const trimmed = newGroup.trim();
        if (!trimmed)
            return;
        const group = await createRoutineGroupAction(userId, trimmed);
        setGroups((prev) => [...prev, group]);
        setGroupIds((prev) => [...prev, group.id]);
        setNewGroup('');
    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('La rutina necesita un nombre.');
            return;
        }
        setSaving(true);
        if (routine) {
            await updateRoutineAction(routine.id, {
                name: name.trim(),
                description: description.trim(),
                days,
                groupIds,
            });
        }
        else {
            await createRoutineAction(userId, {
                name: name.trim(),
                description: description.trim(),
                days,
                groupIds,
            });
        }
        setSaving(false);
        onSaved();
    }
    return (<Modal eyebrow={routine ? 'Editar' : 'Nueva'} title={routine ? 'Editar rutina' : 'Nueva rutina'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Nombre
          </label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Push / Empuje" className="rounded-md border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-ring"/>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="desc" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Descripción (opcional)
          </label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Enfoque, objetivo, notas…" className="resize-none rounded-md border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-ring"/>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Grupos (opcional)
          </span>
          {groups.length > 0 && (<div className="flex flex-wrap gap-2">
              {groups.map((g) => {
                const active = groupIds.includes(g.id);
                return (<button key={g.id} type="button" onClick={() => toggleGroup(g.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${active
                        ? 'border-transparent bg-brand text-brand-foreground'
                        : 'border-border text-muted-foreground hover:border-ring'}`}>
                    {g.name}
                  </button>);
            })}
            </div>)}
          <div className="flex gap-2">
            <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddGroup();
            }
        }} placeholder="Nuevo grupo…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"/>
            <button type="button" onClick={handleAddGroup} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted">
              <Plus className="size-4"/>
              Crear
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Días sugeridos (opcional)
          </span>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
            const active = days.includes(d);
            return (<button key={d} type="button" onClick={() => toggleDay(d)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${active
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-ring'}`}>
                  {d}
                </button>);
        })}
          </div>
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

        {routine && (confirmDelete ? (<div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                ¿Borrar "{routine.name}"? Se pierden sus {routine.exercises.length} ejercicios{executionCount > 0 && ` y las ${executionCount} ejecuciones de su historial`}. Esto no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted">
                  Cancelar
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-60">
                  {deleting ? 'Borrando…' : 'Sí, borrar'}
                </button>
              </div>
            </div>) : (<button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex w-fit items-center gap-1.5 self-center text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive">
              <Trash2 className="size-3.5"/>
              Borrar rutina
            </button>))}
      </form>
    </Modal>);
}
