'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/metric-card';
import { BarChart, type BarItem } from '@/components/dashboard/bar-chart';
import { StartRoutineButton } from '@/components/dashboard/start-routine-button';
import { computeZoneDeltas } from '@/lib/measurements-utils';
import type { PRRow } from '@/lib/exercises-utils';
import { computeAverage, computeDailySeries } from '@/lib/calories-utils';
import { formatNumber, formatShortDate, signed } from '@/lib/format';
import { dayAbbr, lastNLocalDates, useToday } from '@/lib/local-date';
import type { MeasurementEntry, CalorieEntry, Routine } from '@/lib/types';

interface DashboardViewProps {
  userId: string;
  displayName: string;
  measurements: MeasurementEntry[];
  prTable: PRRow[];
  sessionsThisMonth: number;
  sessionDates: string[];
  calories: CalorieEntry[];
  routines: Routine[];
  activeByRoutine: Record<string, string>;
}

function Card({
  tone = 'light',
  className,
  delay = 0,
  children,
}: {
  tone?: 'light' | 'accent';
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'animate-rise rounded-2xl p-5',
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'glass text-card-foreground',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>;
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="press flex shrink-0 items-center gap-0.5 text-sm font-bold text-muted-foreground hover:text-foreground">
      {children}
      <ChevronRight className="size-4" />
    </Link>
  );
}

const WEEK_PLACEHOLDER: BarItem[] = Array.from({ length: 7 }, (_, i) => ({ key: String(i), label: '', height: 0.14, readout: '', tone: 'rest' }));

export function DashboardView({ userId, displayName, measurements, prTable, sessionsThisMonth, sessionDates, calories, routines, activeByRoutine }: DashboardViewProps) {
  // The server's clock is not the user's, so anything that depends on "today" waits for the device.
  const today = useToday();

  const zoneDeltas = computeZoneDeltas(measurements);
  const topDelta = zoneDeltas
    .filter((d) => d.delta != null)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))[0];
  const deltaSince = topDelta
    ? measurements.filter((e) => e.values[topDelta.zone] != null).map((e) => e.date).sort()[0]
    : undefined;

  const topPR = prTable[0];
  const avg7 = computeAverage(calories, 7);

  const executionDates = new Set(sessionDates);
  const weekItems: BarItem[] = today
    ? lastNLocalDates(7).map((date) => {
        const done = executionDates.has(date);
        return {
          key: date,
          label: dayAbbr(date),
          height: done ? 1 : 0.14,
          readout: `${dayAbbr(date)} ${formatShortDate(date)} · ${done ? 'Entrenaste' : 'Descanso'}`,
          tone: date === today ? 'today' : done ? 'data' : 'rest',
        };
      })
    : WEEK_PLACEHOLDER;

  const calorieSeries = computeDailySeries(calories, 14);
  const maxCalorie = Math.max(2800, ...calorieSeries.map((c) => c.calories));
  const calorieItems: BarItem[] = calorieSeries.map((c) => ({
    key: c.date,
    label: String(Number(c.date.slice(8, 10))),
    height: c.calories / maxCalorie,
    readout: `${formatShortDate(c.date)} · ${formatNumber(c.calories)} kcal`,
    tone: c.date === today ? 'today' : 'data',
  }));

  const todaysRoutine = today ? routines.find((r) => r.days.includes(dayAbbr(today))) : undefined;

  return (
    <div className="pb-16">
      <div className="flex flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">
          Hola, {displayName}
        </h1>

        {/* One grid for both layouts: on a phone "today" comes first; on desktop it sits in the right column. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2.1fr_1fr]">
          <div className="order-2 grid grid-cols-2 gap-4 lg:order-none lg:col-span-2 lg:grid-cols-4">
            <MetricCard
              label="PR destacado"
              value={topPR ? String(topPR.pr) : '—'}
              unit={topPR ? 'kg' : undefined}
              sub={topPR ? topPR.exerciseName : 'Sin datos todavía'}
              href="/exercises"
              delay={60}
            />
            <MetricCard
              label="Mayor cambio"
              value={topDelta ? signed(topDelta.delta!) : '—'}
              unit={topDelta ? 'cm' : undefined}
              sub={topDelta ? `${topDelta.label}${deltaSince ? ` · desde ${formatShortDate(deltaSince).replace(' ', ' ')}` : ''}` : 'Sin datos todavía'}
              trend={topDelta?.delta ?? undefined}
              href="/measurements"
              delay={120}
            />
            <MetricCard
              label="Prom. 7 días"
              value={formatNumber(avg7)}
              unit="kcal"
              sub="Consumo calórico"
              href="/calories"
              delay={180}
            />
            <MetricCard
              label="Este mes"
              value={String(sessionsThisMonth)}
              sub="Rutinas registradas"
              href="/exercises"
              delay={240}
            />
          </div>

          <div className="order-3 flex flex-col gap-6 lg:order-none">
            <Card delay={160}>
              <CardTitle>Sesiones de entreno</CardTitle>
              <div className="mt-4">
                <BarChart items={weekItems} ariaLabel="Sesiones de los últimos 7 días" />
              </div>
            </Card>

            <Card delay={220}>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Calorías · 14 días</CardTitle>
                <CardLink href="/calories">Ver</CardLink>
              </div>
              {calorieItems.length === 0 ? (
                <p className="mt-6 py-6 text-center text-sm text-muted-foreground">
                  Registra tus calorías para ver esta gráfica.
                </p>
              ) : (
                <div className="mt-4">
                  <BarChart
                    items={calorieItems}
                    heightClass="h-[110px]"
                    reference={avg7 / maxCalorie}
                    ariaLabel="Calorías de los últimos 14 días"
                  />
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span aria-hidden className="w-5 border-t border-dashed border-white/60" />
                    Promedio 7 días: {formatNumber(avg7)} kcal
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="contents lg:flex lg:flex-col lg:gap-6">
            <div className="order-1 lg:order-none">
              {today === null ? (
                <Card className="min-h-[236px]">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
                  <div className="mt-4 h-7 w-3/4 animate-pulse rounded-full bg-white/15" />
                </Card>
              ) : todaysRoutine ? (
                <Card tone="accent">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em]">
                    <span>Rutina de hoy</span>
                    <span className="opacity-70">{dayAbbr(today)}</span>
                  </div>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold leading-[1.05] tracking-[-0.02em]">{todaysRoutine.name}</h2>
                  {todaysRoutine.description && (
                    <p className="mt-2 line-clamp-2 text-sm opacity-80">{todaysRoutine.description}</p>
                  )}
                  {todaysRoutine.exercises.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-1.5 rounded-xl bg-[var(--ink)]/10 p-3 text-sm">
                      {todaysRoutine.exercises.slice(0, 3).map((ex) => (
                        <li key={ex.id} className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-semibold">{ex.name}</span>
                          <span className="shrink-0 font-mono text-xs opacity-70">{ex.sets}×{ex.reps}</span>
                        </li>
                      ))}
                      {todaysRoutine.exercises.length > 3 && (
                        <li className="text-xs opacity-70">+{todaysRoutine.exercises.length - 3} más</li>
                      )}
                    </ul>
                  )}
                  <StartRoutineButton userId={userId} routineId={todaysRoutine.id} activeExecutionId={activeByRoutine[todaysRoutine.id]} />
                </Card>
              ) : (
                <Card>
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Hoy</span>
                  <div className="mt-1 font-heading text-xl font-bold tracking-tight">No tienes rutina programada</div>
                  <Link href="/exercises" className="press mt-3 inline-flex items-center gap-0.5 text-sm font-bold text-brand">
                    Ir a ejercicios
                    <ChevronRight className="size-4" />
                  </Link>
                </Card>
              )}
            </div>

            <Card className="order-4 lg:order-none" delay={280}>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Mejores marcas</CardTitle>
                <CardLink href="/exercises">Todos</CardLink>
              </div>
              {prTable.length === 0 ? (
                <p className="mt-4 py-4 text-center text-sm text-muted-foreground">
                  Registra una ejecución para ver tus PRs aquí.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {prTable.slice(0, 4).map((row, i) => (
                    <div key={row.exerciseName} className="flex items-center gap-3">
                      <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold', i === 0 ? 'bg-white/25' : 'bg-muted text-muted-foreground')}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{row.exerciseName}</div>
                        <div className="text-xs text-muted-foreground">{row.muscleGroup}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">{row.pr} kg</div>
                        <div className={cn('text-xs font-bold', row.pct >= 0 ? 'text-[var(--lime)]' : 'text-destructive')}>
                          {signed(row.pct, '%')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
