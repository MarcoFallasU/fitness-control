'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { MetricCard } from '@/components/metric-card';
import { ThemedBarChart, ThemedLineChart } from '@/components/charts';
import { CalorieForm } from './calorie-form';
import { findTodayEntry, computeAverage, computeDailySeries, computeWeeklyAverages, computeMonthlyAverages, computeCalorieComparison, } from '@/lib/calories-utils';
import type { User, CalorieEntry } from '@/lib/types';
import { formatShortDate, formatMonth, formatLongDate, formatNumber, TODAY_ISO } from '@/lib/format';
interface CaloriesViewProps {
    me: User;
    other?: User;
    entries: CalorieEntry[];
    otherEntries: CalorieEntry[];
}
export function CaloriesView({ me, other, entries, otherEntries }: CaloriesViewProps) {
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);
    const [compare, setCompare] = useState(false);
    const today = useMemo(() => findTodayEntry(entries, TODAY_ISO), [entries]);
    const avg7 = useMemo(() => computeAverage(entries, 7), [entries]);
    const avg30 = useMemo(() => computeAverage(entries, 30), [entries]);
    const avg365 = useMemo(() => computeAverage(entries, 365), [entries]);
    const daily = useMemo(() => computeDailySeries(entries, 28).map((d) => ({
        date: formatShortDate(d.date),
        calories: d.calories,
    })), [entries]);
    const dailyCompare = useMemo(() => {
        if (!other)
            return [];
        return computeCalorieComparison(entries, otherEntries, 28).map((d) => ({
            date: formatShortDate(d.date),
            a: d.a,
            b: d.b,
        }));
    }, [entries, otherEntries, other]);
    const weekly = useMemo(() => computeWeeklyAverages(entries, 26).map((w) => ({
        week: formatShortDate(w.week),
        calories: w.calories,
    })), [entries]);
    const monthly = useMemo(() => computeMonthlyAverages(entries).map((m) => ({
        month: formatMonth(m.month),
        calories: m.calories,
    })), [entries]);
    const history = useMemo(() => [...entries].reverse().slice(0, 30), [entries]);
    return (<div className="pb-16">
      <PageHeader eyebrow="NUTRICIÓN" title="Control" highlight="calórico" description="Registra tu consumo diario y analiza tus tendencias por semana, mes y año." action={<button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5">
            {today ? <Pencil className="size-5"/> : <Plus className="size-5"/>}
            {today ? 'Editar hoy' : 'Registrar hoy'}
          </button>}/>

      <div className="px-5 py-8 sm:px-8 lg:px-12">

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Hoy" value={today ? formatNumber(today.calories) : '—'} unit="kcal" accent sub={today ? 'Registrado' : 'Sin registrar'} delay={0}/>
          <MetricCard label="Promedio 7 días" value={formatNumber(avg7)} unit="kcal" delay={60}/>
          <MetricCard label="Promedio 30 días" value={formatNumber(avg30)} unit="kcal" delay={120}/>
          <MetricCard label="Promedio anual" value={formatNumber(avg365)} unit="kcal" delay={180}/>
        </div>


        <div className="mt-6">
          <SectionCard title="Consumo diario" subtitle="Últimas 4 semanas" action={other && (<button onClick={() => setCompare((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${compare
                ? 'border-transparent bg-secondary text-secondary-foreground'
                : 'border-border text-muted-foreground hover:border-ring'}`}>
                  {compare ? `Comparando con ${other.displayName}` : 'Comparar usuarios'}
                </button>)}>
            {compare && other ? (<ThemedBarChart data={dailyCompare} xKey="date" unit=" kcal" height={300} showLegend series={[
                { key: 'a', name: me.displayName, color: me.color },
                { key: 'b', name: other.displayName, color: other.color },
            ]}/>) : (<ThemedBarChart data={daily} xKey="date" unit=" kcal" height={300} series={[{ key: 'calories', name: 'Calorías', color: '#fabc00' }]}/>)}
          </SectionCard>
        </div>


        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Promedio semanal" subtitle="Últimos 6 meses">
            <ThemedLineChart data={weekly} xKey="week" unit=" kcal" height={280} series={[{ key: 'calories', name: 'Promedio', color: '#7c3aed' }]}/>
          </SectionCard>
          <SectionCard title="Promedio mensual" subtitle="Año actual">
            <ThemedBarChart data={monthly} xKey="month" unit=" kcal" height={280} series={[{ key: 'calories', name: 'Promedio', color: '#5b21b6' }]}/>
          </SectionCard>
        </div>


        <div className="mt-6">
          <SectionCard title="Historial" subtitle="Últimos 30 registros">
            {history.length === 0 ? (<p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay registros calóricos.
              </p>) : (<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {history.map((c) => (<div key={c.id} className="rounded-md border border-border p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {formatLongDate(c.date)}
                    </p>
                    <p className="font-heading text-2xl leading-tight">
                      {formatNumber(c.calories)}
                      <span className="text-xs opacity-60"> kcal</span>
                    </p>
                  </div>))}
              </div>)}
          </SectionCard>
        </div>
      </div>

      {formOpen && (<CalorieForm userId={me.id} initialValue={today?.calories} onClose={() => setFormOpen(false)} onSaved={() => {
                setFormOpen(false);
                router.refresh();
            }}/>)}
    </div>);
}
