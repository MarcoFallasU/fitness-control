'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Pencil, Plus, Trash2, Play, History, Dumbbell, Flag, Activity, UserPlus, Check, X, } from 'lucide-react';
import { startTrackingAction, endTrackingAction, removeExerciseAction, createRoutineGroupAction, updateRoutineGroupAction, deleteRoutineGroupAction, } from '@/app/(app)/exercises/actions';
import type { Routine, Exercise, RoutineGroup, RoutineExecution, User } from '@/lib/types';
import { formatLongDate } from '@/lib/format';
import { RoutineForm } from './routine-form';
import { ExerciseForm } from './exercise-form';
interface RoutinesPanelProps {
    userId: string;
    other?: User;
    routines: Routine[];
    groups: RoutineGroup[];
    executions: RoutineExecution[];
    activeExecutions: RoutineExecution[];
    otherActiveExecutions: RoutineExecution[];
    newRoutineSignal: number;
}
const NO_GROUP = '__none__';
export function RoutinesPanel({ userId, other, routines, groups, executions, activeExecutions, otherActiveExecutions, newRoutineSignal }: RoutinesPanelProps) {
    const router = useRouter();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [routineForm, setRoutineForm] = useState<{
        routine?: Routine;
        executionCount?: number;
    } | null>(null);
    const [exerciseForm, setExerciseForm] = useState<{
        routineId: string;
        exercise?: Exercise;
    } | null>(null);
    const [historyFor, setHistoryFor] = useState<string | null>(null);
    const [inviting, setInviting] = useState<string | null>(null);
    const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null);
    const [savingGroup, setSavingGroup] = useState(false);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    useEffect(() => {
        if (newRoutineSignal > 0)
            setRoutineForm({});
    }, [newRoutineSignal]);
    const bump = () => router.refresh();
    const sections = useMemo(() => {
        const byId = new Map<string, RoutineGroup>(groups.map((g) => [g.id, g]));
        const result: {
            id: string;
            name: string;
            routines: Routine[];
        }[] = [];
        groups.forEach((g) => {
            const inGroup = routines.filter((r) => r.groupIds?.includes(g.id));
            result.push({ id: g.id, name: g.name, routines: inGroup });
        });
        const ungrouped = routines.filter((r) => !r.groupIds || r.groupIds.filter((id) => byId.has(id)).length === 0);
        if (ungrouped.length) {
            result.push({ id: NO_GROUP, name: 'Sin grupo', routines: ungrouped });
        }
        return result;
    }, [routines, groups]);
    const guestActive = useMemo(() => activeExecutions.filter((x) => !routines.some((r) => r.id === x.routineId)), [activeExecutions, routines]);
    function renderRoutine(routine: Routine) {
        const open = expanded === routine.id;
        const completed = executions.filter((x) => x.routineId === routine.id);
        const active = activeExecutions.filter((x) => x.routineId === routine.id);
        const otherActive = otherActiveExecutions.filter((x) => x.routineId === routine.id);
        const canInvite = !!other && otherActive.length === 0;
        return (<div key={routine.id} className="overflow-hidden rounded-lg border border-border bg-card">

        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => setExpanded(open ? null : routine.id)} className="flex flex-1 items-center gap-3 text-left ">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="size-5"/>
            </span>
            <div>
              <h3 className="font-heading text-2xl uppercase tracking-wide text-card-foreground">
                {routine.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {routine.exercises.length} ejercicios
                {routine.days.length > 0 && ` · ${routine.days.join(', ')}`}
                {` · ${completed.length} ejecuciones`}
                {active.length > 0 && ` · ${active.length} en curso`}
              </p>
            </div>
            <ChevronDown className={`ml-auto size-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}/>
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={async () => {
                const exec = await startTrackingAction(userId, routine.id);
                if (exec)
                    router.push(`/session/${exec.id}`);
                else
                    bump();
            }} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-wider  transition-transform hover:-translate-y-0.5 text-card-foreground">
              <Play className="size-4 text-card-foreground"/>
              Iniciar
            </button>
            <button onClick={() => setHistoryFor(historyFor === routine.id ? null : routine.id)} className="text-card-foreground inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted">
              <History className="size-4"/>
              Historial
            </button>
            <button onClick={() => setRoutineForm({ routine, executionCount: completed.length })} className=" text-card-foreground inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted">
              <Pencil className="size-4"/>
              Editar
            </button>
          </div>
        </div>

        {routine.description && open && (<p className="border-b border-border bg-muted px-5 py-3 text-sm text-muted-foreground">
            {routine.description}
          </p>)}


        {(active.length > 0 || otherActive.length > 0) && (<div className="border-b border-border bg-brand/10 p-5">
            <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Activity className="size-3.5 text-brand"/>
              Seguimientos en curso
            </p>
            <ul className="flex flex-col gap-2">
              {active.map((x) => (<li key={x.id} className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{formatLongDate(x.date)}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {x.exercises.length} ejercicios en seguimiento
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => router.push(`/session/${x.id}`)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted">
                      <Pencil className="size-4"/>
                      Continuar
                    </button>
                    {canInvite && (<button onClick={async () => {
                            setInviting(x.id);
                            await startTrackingAction(other!.id, routine.id);
                            setInviting(null);
                            bump();
                        }} disabled={inviting === x.id} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted disabled:opacity-60">
                        <UserPlus className="size-4"/>
                        Invitar a {other!.displayName}
                      </button>)}
                    <button onClick={async () => {
                        await endTrackingAction(x.id);
                        bump();
                    }} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-foreground transition-transform hover:-translate-y-0.5">
                      <Flag className="size-4"/>
                      Finalizar
                    </button>
                  </div>
                </li>))}
              {otherActive.map((x) => (<li key={x.id} className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold text-ink" style={{ backgroundColor: other?.color }}>
                      {other?.displayName[0]}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {other?.displayName} · {formatLongDate(x.date)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {x.exercises.length} ejercicios en seguimiento
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Entrenando
                  </span>
                </li>))}
            </ul>
          </div>)}


        {open && (<div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Ejercicios
              </p>
              <button onClick={() => setExerciseForm({ routineId: routine.id })} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-foreground transition-transform hover:-translate-y-0.5">
                <Plus className="size-4"/>
                Añadir
              </button>
            </div>
            {routine.exercises.length === 0 ? (<p className="py-6 text-center text-sm text-muted-foreground">
                Sin ejercicios. Añade el primero.
              </p>) : (<ul className="flex flex-col gap-2">
                {routine.exercises.map((ex) => (<li key={ex.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{ex.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {ex.muscleGroup} · {ex.sets}×{ex.reps} · {ex.weight} kg
                      </p>
                      {ex.notes && (<p className="mt-1 text-xs italic text-muted-foreground">
                          {ex.notes}
                        </p>)}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setExerciseForm({ routineId: routine.id, exercise: ex })} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground" aria-label="Editar ejercicio">
                        <Pencil className="size-4"/>
                      </button>
                      <button onClick={async () => {
                            await removeExerciseAction(routine.id, ex.id);
                            bump();
                        }} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar ejercicio">
                        <Trash2 className="size-4"/>
                      </button>
                    </div>
                  </li>))}
              </ul>)}
          </div>)}


        {historyFor === routine.id && (<div className="border-t border-border bg-muted p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Historial de ejecuciones
            </p>
            {completed.length === 0 ? (<p className="py-4 text-center text-sm text-muted-foreground">
                Aún no has completado esta rutina.
              </p>) : (<ul className="flex flex-col gap-3">
                {completed.map((x) => (<li key={x.id} className="rounded-md border border-border bg-card p-3">
                    <p className="mb-2 font-heading text-base uppercase tracking-wide">
                      {formatLongDate(x.date)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {x.exercises.map((e, i) => (<span key={i} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
                          <span className="font-semibold">{e.exerciseName}</span>{' '}
                          <span className="text-muted-foreground">
                            {e.sets}×{e.reps} · {e.weight}kg
                          </span>
                        </span>))}
                    </div>
                  </li>))}
              </ul>)}
          </div>)}
      </div>);
    }
    return (<div className="flex flex-col gap-8">
      {guestActive.length > 0 && (<section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground">
              Entrenando por invitación
            </h2>
            <span className="h-px flex-1 bg-border" aria-hidden/>
          </div>
          <ul className="flex flex-col gap-2">
            {guestActive.map((x) => (<li key={x.id} className="flex flex-col gap-2 rounded-lg border border-border bg-brand/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-lg uppercase tracking-wide text-card-foreground">{x.routineName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatLongDate(x.date)} · {x.exercises.length} ejercicios en seguimiento
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/session/${x.id}`)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted">
                    <Pencil className="size-4"/>
                    Continuar
                  </button>
                  <button onClick={async () => {
                        await endTrackingAction(x.id);
                        bump();
                    }} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-foreground transition-transform hover:-translate-y-0.5">
                    <Flag className="size-4"/>
                    Finalizar
                  </button>
                </div>
              </li>))}
          </ul>
        </section>)}

      {routines.length === 0 && guestActive.length === 0 && (<p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tienes rutinas todavía. Crea tu primera rutina.
        </p>)}

      {sections.map((section) => {
        const isRealGroup = section.id !== NO_GROUP;
        const isEditing = editingGroup?.id === section.id;
        const isConfirmingDelete = confirmDeleteGroup === section.id;
        return (<section key={section.id} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {isEditing ? (<form onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = editingGroup.name.trim();
                    if (!trimmed)
                        return;
                    setSavingGroup(true);
                    await updateRoutineGroupAction(section.id, trimmed);
                    setSavingGroup(false);
                    setEditingGroup(null);
                    bump();
                }} className="flex flex-1 items-center gap-2">
                <input autoFocus value={editingGroup.name} onChange={(e) => setEditingGroup({ id: section.id, name: e.target.value })} className="rounded-md border border-input bg-background px-3 py-1.5 font-heading text-lg uppercase tracking-wide text-foreground outline-none focus:border-ring"/>
                <button type="submit" disabled={savingGroup} aria-label="Guardar nombre" className="rounded-md p-1.5 text-secondary transition-colors hover:bg-muted disabled:opacity-60">
                  <Check className="size-4"/>
                </button>
                <button type="button" onClick={() => setEditingGroup(null)} aria-label="Cancelar" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                  <X className="size-4"/>
                </button>
              </form>) : isConfirmingDelete ? (<div className="flex flex-1 items-center gap-3">
                <p className="text-sm text-destructive">¿Borrar el grupo "{section.name}"? Las rutinas no se eliminan, solo quedan sin grupo.</p>
                <button onClick={async () => {
                        await deleteRoutineGroupAction(section.id);
                        setConfirmDeleteGroup(null);
                        bump();
                    }} className="shrink-0 rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Sí, borrar
                </button>
                <button onClick={() => setConfirmDeleteGroup(null)} className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>) : (<>
                <h2 className="font-heading text-xl uppercase tracking-wide text-foreground">
                  {section.name}
                </h2>
                <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {section.routines.length}
                </span>
                {isRealGroup && (<div className="flex items-center gap-1">
                    <button onClick={() => setEditingGroup({ id: section.id, name: section.name })} aria-label="Renombrar grupo" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground">
                      <Pencil className="size-3.5"/>
                    </button>
                    <button onClick={() => setConfirmDeleteGroup(section.id)} aria-label="Borrar grupo" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="size-3.5"/>
                    </button>
                  </div>)}
                <span className="h-px flex-1 bg-border" aria-hidden/>
              </>)}
          </div>
          <div className="flex flex-col gap-4">
            {section.routines.length === 0 ? (<p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Sin rutinas en este grupo. Asígnale una desde "Editar" en una rutina.
              </p>) : section.routines.map((routine) => renderRoutine(routine))}
          </div>
        </section>);
      })}

      {creatingGroup ? (<form onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = newGroupName.trim();
                if (!trimmed)
                    return;
                setSavingGroup(true);
                await createRoutineGroupAction(userId, trimmed);
                setSavingGroup(false);
                setCreatingGroup(false);
                setNewGroupName('');
                bump();
            }} className="flex items-center gap-2">
          <input autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Nombre del grupo…" className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-ring sm:flex-none sm:w-64"/>
          <button type="submit" disabled={savingGroup} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            <Check className="size-4"/>
            Crear
          </button>
          <button type="button" onClick={() => { setCreatingGroup(false); setNewGroupName(''); }} className="rounded-md border border-border p-2.5 text-muted-foreground transition-colors hover:bg-muted">
            <X className="size-4"/>
          </button>
        </form>) : (<button onClick={() => setCreatingGroup(true)} className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-ring hover:text-card-foreground">
          <Plus className="size-4"/>
          Nuevo grupo
        </button>)}

      {routineForm && (<RoutineForm userId={userId} routine={routineForm.routine} executionCount={routineForm.executionCount} initialGroups={groups} onClose={() => setRoutineForm(null)} onSaved={() => {
                setRoutineForm(null);
                bump();
            }}/>)}

      {exerciseForm && (<ExerciseForm routineId={exerciseForm.routineId} exercise={exerciseForm.exercise} onClose={() => setExerciseForm(null)} onSaved={() => {
                setExerciseForm(null);
                bump();
            }}/>)}
    </div>);
}
