import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Clock, Dumbbell, Minus, Trophy } from 'lucide-react';
import type { ExerciseSummary, SessionSummary, Trend } from '@/lib/session-summary';

function formatDuration(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0)
        return `${h} h ${String(m).padStart(2, '0')} min`;
    if (m > 0)
        return `${m} min ${String(s).padStart(2, '0')} s`;
    return `${s} s`;
}

const TREND = {
    up: { Icon: ArrowUpRight, color: 'var(--lime)' },
    down: { Icon: ArrowDownRight, color: 'var(--coral)' },
    same: { Icon: Minus, color: 'rgba(255,255,255,0.8)' },
    new: { Icon: Minus, color: 'rgba(255,255,255,0.8)' },
} satisfies Record<Trend, { Icon: typeof Minus; color: string }>;

function Delta({ trend, pct }: { trend: Trend; pct?: number }) {
    const { Icon, color } = TREND[trend];
    return (<span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold" style={{ color }}>
      <Icon className="size-3.5"/>
      {trend === 'new' ? 'Nuevo' : pct !== undefined ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
    </span>);
}

function ExerciseRow({ ex }: { ex: ExerciseSummary }) {
    return (<li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold">
          {ex.exerciseName}
          {ex.isPR && <Trophy className="size-3.5 shrink-0 text-[var(--yellow)]" aria-label="Récord personal"/>}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {ex.sets} series · máx {ex.topWeight} kg · {ex.volume.toLocaleString('es')} kg totales
          {ex.prevTopWeight !== undefined && <> · antes {ex.prevTopWeight} kg</>}
        </p>
      </div>
      <Delta trend={ex.trend} pct={ex.volumeDeltaPct}/>
    </li>);
}

export function SessionSummaryView({ summary, durationSeconds }: {
    summary: SessionSummary;
    durationSeconds?: number;
}) {
    const overall = TREND[summary.trend];
    const OverallIcon = overall.Icon;
    const headline = summary.trend === 'new'
        ? 'Primera sesión registrada de esta rutina'
        : summary.trend === 'up'
            ? 'Mejoraste respecto a la última vez'
            : summary.trend === 'down'
                ? 'Rendimiento menor que la última vez'
                : 'Mantuviste tu rendimiento';

    const stats = [
        { label: 'Tiempo', value: durationSeconds !== undefined ? formatDuration(durationSeconds) : '—', Icon: Clock },
        { label: 'Volumen', value: `${summary.totalVolume.toLocaleString('es')} kg`, Icon: Dumbbell },
        { label: 'Completados', value: `${summary.doneCount}/${summary.total}`, Icon: Check },
        { label: 'Récords', value: String(summary.prCount), Icon: Trophy },
    ];

    return (<div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-10 pt-8 sm:px-8">
      <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
        Rutina terminada · {summary.date}
      </p>
      <h1 className="mt-1 text-balance font-heading text-3xl font-extrabold leading-tight">{summary.routineName}</h1>

      <section className="glass animate-rise mt-5 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--lg-fill-active)] shadow-[var(--lg-active-shadow)]" style={{ color: overall.color }}>
            <OverallIcon className="size-6"/>
          </span>
          <div>
            <p className="font-heading text-lg font-extrabold leading-tight">{headline}</p>
            {summary.trend !== 'new' && summary.volumeDeltaPct !== undefined && (<p className="text-sm font-semibold" style={{ color: overall.color }}>
                {summary.volumeDeltaPct > 0 ? '+' : ''}{summary.volumeDeltaPct}% de volumen
                {summary.prevDate && <span className="font-normal text-muted-foreground"> vs {summary.prevDate}</span>}
              </p>)}
          </div>
        </div>
        {summary.trend !== 'new' && (<div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 py-2"><p className="font-extrabold text-[var(--lime)]">{summary.improved}</p><p className="text-[11px] text-muted-foreground">Mejoraron</p></div>
            <div className="rounded-2xl bg-white/10 py-2"><p className="font-extrabold">{summary.same}</p><p className="text-[11px] text-muted-foreground">Iguales</p></div>
            <div className="rounded-2xl bg-white/10 py-2"><p className="font-extrabold text-[var(--coral)]">{summary.worse}</p><p className="text-[11px] text-muted-foreground">Bajaron</p></div>
          </div>)}
      </section>

      <div className="mt-3.5 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, Icon }, i) => (<div key={label} className="glass animate-rise rounded-2xl p-4" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <Icon className="size-3.5"/>{label}
            </p>
            <p className="mt-1.5 text-xl font-extrabold tabular-nums">{value}</p>
          </div>))}
      </div>

      <section className="glass mt-3.5 rounded-3xl px-5 py-2">
        <ul className="divide-y divide-[var(--glass-border)]">
          {summary.exercises.map((ex) => <ExerciseRow key={ex.exerciseName} ex={ex}/>)}
        </ul>
      </section>

      <Link href="/exercises" className="bg-brand mt-6 flex items-center justify-center gap-2 rounded-full py-3.5 font-heading text-sm font-extrabold">
        Volver a ejercicios <ArrowRight className="size-4"/>
      </Link>
    </div>);
}
