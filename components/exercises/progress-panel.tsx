'use client';
import { useMemo, useState } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { ThemedLineChart } from '@/components/charts';
import { computeExerciseNames, computeExerciseProgress, computeExerciseComparison, computePR, computePRTable, } from '@/lib/exercises-utils';
import type { User, RoutineExecution } from '@/lib/types';
import { formatShortDate, signed } from '@/lib/format';
interface ProgressPanelProps {
    me: User;
    other?: User;
    myExecutions: RoutineExecution[];
    otherExecutions: RoutineExecution[];
}
export function ProgressPanel({ me, other, myExecutions, otherExecutions }: ProgressPanelProps) {
    const names = useMemo(() => computeExerciseNames(myExecutions), [myExecutions]);
    const [selected, setSelected] = useState<string>(names[0] ?? '');
    const [compare, setCompare] = useState(false);
    const prTable = useMemo(() => computePRTable(myExecutions), [myExecutions]);
    const activeSelected = selected || names[0] || '';
    const progress = useMemo(() => {
        if (!activeSelected)
            return [];
        if (compare && other) {
            return computeExerciseComparison(myExecutions, otherExecutions, activeSelected).map((p) => ({
                date: formatShortDate(p.date),
                a: p.a,
                b: p.b,
            }));
        }
        return computeExerciseProgress(myExecutions, activeSelected).map((p) => ({
            date: formatShortDate(p.date),
            weight: p.weight,
        }));
    }, [activeSelected, compare, myExecutions, otherExecutions, other]);
    const myPR = useMemo(() => (activeSelected ? computePR(myExecutions, activeSelected) : 0), [activeSelected, myExecutions]);
    const otherPR = useMemo(() => (activeSelected && other ? computePR(otherExecutions, activeSelected) : 0), [activeSelected, other, otherExecutions]);
    const series = compare
        ? [
            { key: 'a', name: me.displayName, color: me.color },
            { key: 'b', name: other?.displayName ?? 'Otro', color: other?.color ?? '#5b21b6' },
        ]
        : [{ key: 'weight', name: activeSelected, color: '#fabc00' }];
    if (names.length === 0) {
        return (<p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Registra la ejecución de una rutina para ver tu progreso aquí.
      </p>);
    }
    return (<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <SectionCard title="Progreso de peso" subtitle="Peso máximo levantado por sesión" className="lg:col-span-2" action={other && (<button onClick={() => setCompare((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${compare
                ? 'border-transparent bg-secondary text-secondary-foreground'
                : 'border-border text-muted-foreground hover:border-ring'}`}>
              {compare ? `Comparando con ${other.displayName}` : 'Comparar usuarios'}
            </button>)}>
        <div className="mb-5 flex flex-wrap gap-2">
          {names.map((n) => {
            const active = activeSelected === n;
            return (<button key={n} onClick={() => setSelected(n)} className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${active
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-ring'}`}>
                {n}
              </button>);
        })}
        </div>

        {compare && other && (<div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PR {me.displayName}
              </p>
              <p className="font-heading text-3xl" style={{ color: me.color }}>
                {myPR} <span className="text-base opacity-60">kg</span>
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PR {other.displayName}
              </p>
              <p className="font-heading text-3xl" style={{ color: other.color }}>
                {otherPR} <span className="text-base opacity-60">kg</span>
              </p>
            </div>
          </div>)}

        <ThemedLineChart data={progress} xKey="date" unit=" kg" height={320} series={series}/>
      </SectionCard>


      <SectionCard title="Récords personales" subtitle="Peso máximo histórico por ejercicio">
        <ul className="flex flex-col divide-y divide-border">
          {prTable.map((row, i) => (<li key={row.exerciseName} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {i === 0 && <Trophy className="size-4 shrink-0 text-brand"/>}
                  {row.exerciseName}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{row.muscleGroup}</p>
              </div>
              <div className="text-right">
                <p className="font-heading text-xl leading-none">
                  {row.pr} <span className="text-xs opacity-60">kg</span>
                </p>
                <p className={`flex items-center justify-end gap-0.5 text-xs font-medium ${row.pct >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  <Flame className="size-3"/>
                  {signed(row.pct, '%')}
                </p>
              </div>
            </li>))}
        </ul>
      </SectionCard>
    </div>);
}
