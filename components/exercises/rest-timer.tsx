'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

const PRESETS = [60, 90, 120, 180];

function format(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Rest stopwatch. Counts up; an optional target marks when the rest is done. */
export function RestTimer() {
    const [elapsedMs, setElapsedMs] = useState(0);
    const [running, setRunning] = useState(false);
    const [target, setTarget] = useState<number | null>(90);
    // Timestamp-based so the count stays right when the tab is throttled in background.
    const startedAt = useRef(0);
    const baseMs = useRef(0);
    const notified = useRef(false);

    useEffect(() => {
        if (!running)
            return;
        const id = setInterval(() => setElapsedMs(baseMs.current + Date.now() - startedAt.current), 200);
        return () => clearInterval(id);
    }, [running]);

    const seconds = Math.floor(elapsedMs / 1000);
    const reached = target != null && seconds >= target;

    useEffect(() => {
        if (reached && running && !notified.current) {
            notified.current = true;
            navigator.vibrate?.([200, 100, 200]);
        }
    }, [reached, running]);

    function toggle() {
        if (running) {
            baseMs.current = elapsedMs;
            setRunning(false);
        }
        else {
            startedAt.current = Date.now();
            setRunning(true);
        }
    }

    function reset() {
        setRunning(false);
        baseMs.current = 0;
        notified.current = false;
        setElapsedMs(0);
    }

    function pickTarget(value: number) {
        notified.current = false;
        setTarget((prev) => (prev === value ? null : value));
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
          <button type="button" onClick={reset} aria-label="Reiniciar descanso" className="flex size-10 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/[0.08]">
            <RotateCcw className="size-4"/>
          </button>
          <button type="button" onClick={toggle} aria-label={running ? 'Pausar descanso' : 'Iniciar descanso'} className="flex size-12 items-center justify-center rounded-full bg-brand">
            {running ? <Pause className="size-5"/> : <Play className="size-5"/>}
          </button>
        </div>
      </div>

      {target != null && (<div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.12]">
          <div className={`h-full rounded-full transition-[width] ${reached ? 'bg-[var(--lime)]' : 'bg-white/90'}`} style={{ width: `${pct}%` }}/>
        </div>)}

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (<button key={p} type="button" aria-pressed={target === p} onClick={() => pickTarget(p)} className={`rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-xs font-bold ${target === p ? 'bg-[var(--lg-fill-active)] shadow-[var(--lg-active-shadow)]' : 'bg-white/[0.06] text-muted-foreground'}`}>
            {`${p / 60} min`}
          </button>))}
      </div>
    </div>);
}
