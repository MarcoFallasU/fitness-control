'use client';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/metric-card';
import { computeZoneDeltas } from '@/lib/measurements-utils';
import { computePRTable, countExecutionsThisMonth } from '@/lib/exercises-utils';
import { computeAverage, computeDailySeries } from '@/lib/calories-utils';
import { formatNumber, signed } from '@/lib/format';
import type { MeasurementEntry, RoutineExecution, CalorieEntry, Routine } from '@/lib/types';

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface DashboardViewProps {
  displayName: string;
  measurements: MeasurementEntry[];
  executions: RoutineExecution[];
  calories: CalorieEntry[];
  routines: Routine[];
}

function Card({
  tone = 'light',
  className,
  children,
}: {
  tone?: 'light' | 'accent';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'glass text-card-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <b className="font-heading text-lg">{children}</b>;
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function DashboardView({ displayName, measurements, executions, calories, routines }: DashboardViewProps) {
  const zoneDeltas = computeZoneDeltas(measurements);
  const topDelta = zoneDeltas
    .filter((d) => d.delta != null)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))[0];

  const prTable = computePRTable(executions);
  const topPR = prTable[0];

  const avg7 = computeAverage(calories, 7);
  const monthlyExecs = countExecutionsThisMonth(executions);

  const last7Dates = lastNDates(7);
  const executionDates = new Set(executions.map((x) => x.date));
  const weekBars = last7Dates.map((date) => ({
    date,
    done: executionDates.has(date),
    label: DAY_ABBR[new Date(`${date}T00:00:00Z`).getUTCDay()],
  }));

  const calorieSeries = computeDailySeries(calories, 14);
  const maxCalorie = Math.max(2800, ...calorieSeries.map((c) => c.calories));

  const todayAbbr = DAY_ABBR[new Date().getUTCDay()];
  const todaysRoutine = routines.find((r) => r.days.includes(todayAbbr));

  return (
    <div className="pb-16">
      <div className="flex flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
        <div>
          <h1 className="font-heading text-4xl uppercase leading-[0.9] sm:text-5xl">
            Hola, {displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Tu progreso, en un vistazo.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="PR destacado"
            value={topPR ? String(topPR.pr) : '—'}
            unit={topPR ? 'kg' : undefined}
            sub={topPR ? topPR.exerciseName : 'Sin datos todavía'}
          />
          <MetricCard
            label="Cambio de medida"
            value={topDelta ? signed(topDelta.delta!) : '—'}
            unit={topDelta ? 'cm' : undefined}
            sub={topDelta ? topDelta.label : 'Sin datos todavía'}
            trend={topDelta?.delta ?? undefined}
          />
          <MetricCard
            label="Promedio 7 días"
            value={formatNumber(avg7)}
            unit="kcal"
            sub="Consumo calórico"
          />
          <MetricCard
            label="Rutinas del mes"
            value={String(monthlyExecs)}
            sub="Ejecuciones registradas"
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardTitle>Sesiones de entreno</CardTitle>
              <div className="mt-6 flex items-end gap-2.5">
                {weekBars.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end">
                      <div
                        className="w-full rounded"
                        style={{ height: day.done ? '100%' : '14%', background: day.done ? 'var(--yellow)' : 'rgba(255,255,255,0.14)' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <CardTitle>Calorías — últimos 14 días</CardTitle>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                  Promedio {formatNumber(avg7)} kcal
                </span>
              </div>
              {calorieSeries.length === 0 ? (
                <p className="mt-6 py-6 text-center text-sm text-muted-foreground">
                  Registra tus calorías para ver esta gráfica.
                </p>
              ) : (
                <div className="mt-5 flex h-[110px] items-end gap-1.5">
                  {calorieSeries.map((c, i) => (
                    <div
                      key={c.date}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(c.calories / maxCalorie) * 100}%`,
                        background: i === calorieSeries.length - 1 ? 'var(--yellow)' : 'var(--blue)',
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            {todaysRoutine ? (
              <Card tone="accent">
                <span className="text-xs font-bold uppercase tracking-wider">Rutina de hoy</span>
                <div className="mt-1 font-heading text-2xl leading-[0.9]">{todaysRoutine.name}</div>
                {todaysRoutine.description && (
                  <p className="mt-2 max-w-[220px] text-sm">{todaysRoutine.description}</p>
                )}
                <div className="mt-4 flex h-[100px] w-full items-center justify-center rounded-xl bg-[var(--ink)]/10">
                  <Dumbbell className="size-8 text-[var(--ink)]/40" />
                </div>
                <Link
                  href="/exercises"
                  className="mt-4 flex w-full items-center justify-center rounded-md border-2 border-[var(--ink)] bg-transparent py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/10"
                >
                  Ver rutina
                </Link>
              </Card>
            ) : (
              <Card>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hoy</span>
                <div className="mt-1 font-heading text-xl">No tienes rutina programada</div>
                <Link href="/exercises" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
                  Ir a ejercicios ↗
                </Link>
              </Card>
            )}

            <Card>
              <div className="flex items-center justify-between">
                <CardTitle>Mejores marcas</CardTitle>
                <Link href="/exercises" className="shrink-0 text-sm font-bold hover:underline">
                  Todos ↗
                </Link>
              </div>
              {prTable.length === 0 ? (
                <p className="mt-4 py-4 text-center text-sm text-muted-foreground">
                  Registra una ejecución para ver tus PRs aquí.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {prTable.slice(0, 4).map((row) => (
                    <div key={row.exerciseName} className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Dumbbell className="size-4 text-muted-foreground" />
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
