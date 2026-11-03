'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { getPreferences } from '@/lib/preferences';

const PRESETS = [60, 90, 120, 180];

function format(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Everything needed to rebuild the timer after the page was reloaded or discarded in the background. */
interface SavedTimer {
    running: boolean;
    startedAt: number;
    baseMs: number;
    target: number | null;
}

function loadSaved(key: string): SavedTimer | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as SavedTimer : null;
    }
    catch {
        return null;
    }
}

function writeSaved(key: string, data: SavedTimer) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    }
    catch { }
}

/**
 * Rest stopwatch. Counts up; an optional target marks when the rest is done.
 * Its state is kept in localStorage under `storageKey`, so leaving the app (which on a phone often
 * reloads the page when you come back) does not reset it: a running timer keeps counting real time.
 */
export function RestTimer({ storageKey }: {
    storageKey: string;
}) {
    const [elapsedMs, setElapsedMs] = useState(0);
    const [running, setRunning] = useState(false);
    const [target, setTarget] = useState<number | null>(90);
    // Timestamp-based so the count stays right when the tab is throttled in background.
    const startedAt = useRef(0);
    const baseMs = useRef(0);
    const notified = useRef(false);

    // Restore after mount (reading localStorage during render would break hydration).
    useEffect(() => {
        const saved = loadSaved(storageKey);
        if (!saved) {
            setTarget(getPreferences().restSeconds);
            return;
        }
        baseMs.current = saved.baseMs;
        startedAt.current = saved.startedAt;
        const elapsed = saved.running ? saved.baseMs + Date.now() - saved.startedAt : saved.baseMs;
        notified.current = saved.target != null && Math.floor(elapsed / 1000) >= saved.target;
        setTarget(saved.target);
        setElapsedMs(elapsed);
        setRunning(saved.running);
    }, [storageKey]);

    useEffect(() => {
        if (!running)
            return;
        const refresh = () => setElapsedMs(baseMs.current + Date.now() - startedAt.current);
        const id = setInterval(refresh, 200);
        // Catch up immediately when the app comes back to the foreground.
        document.addEventListener('visibilitychange', refresh);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [running]);

    const seconds = Math.floor(elapsedMs / 1000);
    const reached = target != null && seconds >= target;

    useEffect(() => {
        if (reached && running && !notified.current) {
            notified.current = true;
            if (getPreferences().vibrate)
                navigator.vibrate?.([200, 100, 200]);
        }
    }, [reached, running]);

    function save(next: Partial<SavedTimer> = {}) {
        writeSaved(storageKey, { running, startedAt: startedAt.current, baseMs: baseMs.current, target, ...next });
    }

    function toggle() {
        if (running) {
            baseMs.current += Date.now() - startedAt.current;
            setElapsedMs(baseMs.current);
            setRunning(false);
            save({ running: false, baseMs: baseMs.current });
        }
        else {
            startedAt.current = Date.now();
            setRunning(true);
            save({ running: true, startedAt: startedAt.current });
        }
    }

    function reset() {
        setRunning(false);
        baseMs.current = 0;
        startedAt.current = 0;
        notified.current = false;
        setElapsedMs(0);
        save({ running: false, startedAt: 0, baseMs: 0 });
    }

    function pickTarget(value: number) {
        notified.current = false;
        const next = target === value ? null : value;
        setTarget(next);
        save({ target: next });
    }

    const pct = target ? Math.min(100, (seconds / target) * 100) : 0;

    return (<div className="glass mt-3.5 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Descanso
        </p>
        {reached && <span className="text-[11px] font-bold text-[var(--lime)]">¡Listo para la siguiente serie!</span>}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`font-mono text-4xl font-extrabold tabular-nums ${reached ? 'text-[var(--lime)]' : ''}`}>
          {format(seconds)}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} aria-label="Reiniciar descanso" className="press flex size-11 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/[0.08]">
            <RotateCcw className="size-4"/>
          </button>
          <button type="button" onClick={toggle} aria-label={running ? 'Pausar descanso' : 'Iniciar descanso'} className="press flex size-12 items-center justify-center rounded-full bg-brand">
            {running ? <Pause className="size-5"/> : <Play className="size-5"/>}
          </button>
        </div>
      </div>

      {target != null && (<div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.12]">
          <div className={`h-full rounded-full transition-[width] ${reached ? 'bg-[var(--lime)]' : 'bg-white/90'}`} style={{ width: `${pct}%` }}/>
        </div>)}

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (<button key={p} type="button" aria-pressed={target === p} onClick={() => pickTarget(p)} className={`press rounded-full border border-[var(--glass-border)] px-3.5 py-2 text-xs font-bold ${target === p ? 'bg-[var(--lg-fill-active)] shadow-[var(--lg-active-shadow)]' : 'bg-white/[0.06] text-muted-foreground'}`}>
            {`${p / 60} min`}
          </button>))}
      </div>
    </div>);
}
