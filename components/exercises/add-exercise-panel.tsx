'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getKnownExercisesAction } from '@/app/(app)/exercises/actions';
import { Spinner } from '@/components/ui/spinner';
import type { KnownExercise } from '@/lib/types';

/** Inline picker for adding an already-registered exercise to the running session. It never creates new ones. */
export function AddExercisePanel({ existingNames, onPick, onClose }: {
    existingNames: string[];
    onPick: (exercise: KnownExercise) => void;
    onClose: () => void;
}) {
    const [items, setItems] = useState<KnownExercise[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [query, setQuery] = useState('');

    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getKnownExercisesAction().then(setItems).catch(() => setFailed(true));
    }, []);

    // It opens below the fold on a phone: bring it into view, and again once the list has made it taller.
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        panel.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }, [items]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const visible = useMemo(() => {
        const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()));
        const needle = query.trim().toLowerCase();
        return (items ?? []).filter((i) => !taken.has(i.name.trim().toLowerCase()) && i.name.toLowerCase().includes(needle));
    }, [items, existingNames, query]);

    let body: React.ReactNode;
    if (failed)
        body = <p className="py-4 text-center text-sm text-muted-foreground">No se pudo cargar la lista. Ciérrala y vuelve a abrirla.</p>;
    else if (items === null)
        body = <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"><Spinner/> Cargando ejercicios…</p>;
    else if (visible.length === 0)
        body = <p className="py-4 text-center text-sm text-muted-foreground">{query.trim() ? 'Sin resultados.' : 'Ya agregaste todos los ejercicios que tienes registrados.'}</p>;
    else
        body = (<ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {visible.map((item) => (<li key={item.name}>
            <button type="button" onClick={() => onPick(item)} className="press flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/[0.05] p-3 text-left transition-colors hover:border-[var(--glass-border)]">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{item.name}</span>
                <span className="block text-[11px] text-muted-foreground">{item.muscleGroup} · {item.sets}×{item.reps} · {item.weight}kg</span>
              </span>
              <Plus className="size-4 shrink-0 text-muted-foreground"/>
            </button>
          </li>))}
      </ul>);

    return (<div ref={panel} className="glass animate-rise mt-3 scroll-mb-40 rounded-2xl p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-extrabold">Agregar ejercicio</p>
          <p className="text-[11px] text-muted-foreground">Solo ejercicios que ya registraste antes.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-muted-foreground">
          <X className="size-4"/>
        </button>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" aria-label="Buscar ejercicio" className="mt-3 h-11 w-full rounded-xl border border-input bg-white/5 px-3 text-base text-foreground outline-none focus:border-ring"/>
      <div className="mt-2.5">{body}</div>
    </div>);
}
