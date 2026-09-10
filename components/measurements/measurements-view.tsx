'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { ThemedLineChart } from '@/components/charts';
import { MeasurementForm } from './measurement-form';
import { MEASUREMENT_ZONES, CHART_ZONES, computeZoneDeltas, computeZoneSeries, zoneLabel, zoneUnit, } from '@/lib/measurements-utils';
import type { MeasurementEntry, MeasurementZone } from '@/lib/types';
import { formatLongDate, formatShortDate, signed } from '@/lib/format';
interface MeasurementsViewProps {
    entries: MeasurementEntry[];
}
export function MeasurementsView({ entries }: MeasurementsViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedZones, setSelectedZones] = useState<MeasurementZone[]>([
        'chest',
        'shoulders',
        'back',
    ]);
    const [formOpen, setFormOpen] = useState(false);
    const userId = user.id;
    const deltas = useMemo(() => computeZoneDeltas(entries), [entries]);
    const series = useMemo(() => {
        return computeZoneSeries(entries, selectedZones).map((row) => ({
            ...row,
            date: formatShortDate(row.date as string),
        }));
    }, [entries, selectedZones]);
    const chartColors = ['#fabc00', '#7c3aed', '#5b21b6', '#9ef01a', '#ff3d5a'];
    function toggleZone(zone: MeasurementZone) {
        setSelectedZones((prev) => prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]);
    }
    return (<div className="pb-16">
      <PageHeader eyebrow="MEDIDAS" title="Medidas" highlight="corporales" description="Registra tus medidas cuando quieras y observa la evolución de cada zona en el tiempo." action={<button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5">
            <Plus className="size-5"/>
            Nueva entrada
          </button>}/>

      <div className="grid grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-3 lg:px-12">
        
        <SectionCard title="Evolución por zona" subtitle="Selecciona las zonas que quieres comparar" className="lg:col-span-2">
          <div className="mb-5 flex flex-wrap gap-2">
            {CHART_ZONES.map((z) => {
            const active = selectedZones.includes(z.key);
            return (<button key={z.key} onClick={() => toggleZone(z.key)} className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${active
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-ring'}`}>
                  {z.label}
                </button>);
        })}
          </div>
          <ThemedLineChart data={series} xKey="date" unit=" cm" height={320} series={selectedZones.map((z, i) => ({
            key: z,
            name: zoneLabel(z),
            color: chartColors[i % chartColors.length],
        }))}/>
        </SectionCard>

        
        <SectionCard title="Primera vs última" subtitle="Cambio total desde tu primer registro">
          <ul className="flex flex-col divide-y divide-border">
            {deltas.map((d) => {
            const hasData = d.delta != null;
            const positive = (d.delta ?? 0) > 0;
            const flat = (d.delta ?? 0) === 0;
            const unit = zoneUnit(d.zone);
            return (<li key={d.zone} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold">{d.label}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {hasData ? `${d.first} → ${d.last} ${unit}` : 'Sin datos'}
                    </p>
                  </div>
                  {hasData && (<div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 font-heading text-lg ${flat
                        ? 'text-muted-foreground'
                        : positive
                            ? 'text-secondary'
                            : 'text-destructive'}`}>
                        {flat ? (<Minus className="size-4"/>) : positive ? (<TrendingUp className="size-4"/>) : (<TrendingDown className="size-4"/>)}
                        {signed(d.delta!, ` ${unit}`)}
                      </span>
                      <span className="w-14 text-right font-mono text-xs text-muted-foreground">
                        {signed(d.pct!, '%')}
                      </span>
                    </div>)}
                </li>);
        })}
          </ul>
        </SectionCard>
      </div>

      
      <div className="px-5 sm:px-8 lg:px-12">
        <SectionCard title="Historial" subtitle={`${entries.length} entradas registradas`}>
          {entries.length === 0 ? (<p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay registros. Crea tu primera entrada.
            </p>) : (<div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </th>
                    {MEASUREMENT_ZONES.map((z) => (<th key={z.key} className="px-3 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {z.label} ({z.unit})
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((e) => (<tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted">
                      <td className="whitespace-nowrap py-3 pr-4 font-semibold">
                        {formatLongDate(e.date)}
                      </td>
                      {MEASUREMENT_ZONES.map((z) => (<td key={z.key} className="px-3 py-3 text-right tabular-nums">
                          {e.values[z.key] != null ? (e.values[z.key]) : (<span className="text-muted-foreground/40">—</span>)}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </SectionCard>
      </div>

      {formOpen && (<MeasurementForm userId={userId} onClose={() => setFormOpen(false)} onSaved={() => {
                setFormOpen(false);
                router.refresh();
            }}/>)}
    </div>);
}
