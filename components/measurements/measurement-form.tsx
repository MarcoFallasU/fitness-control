'use client';
import { useState } from 'react';
import { Modal } from '@/components/modal';
import { MEASUREMENT_ZONES } from '@/lib/measurements-utils';
import { addMeasurementAction } from '@/app/(app)/measurements/actions';
import type { MeasurementZone } from '@/lib/types';
import { TODAY_ISO } from '@/lib/format';
interface MeasurementFormProps {
    userId: string;
    onClose: () => void;
    onSaved: () => void;
}
export function MeasurementForm({ userId, onClose, onSaved }: MeasurementFormProps) {
    const [date, setDate] = useState(TODAY_ISO);
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    function update(zone: MeasurementZone, value: string) {
        setValues((prev) => ({ ...prev, [zone]: value }));
    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed: Partial<Record<MeasurementZone, number>> = {};
        let count = 0;
        for (const z of MEASUREMENT_ZONES) {
            const raw = values[z.key];
            if (raw != null && raw !== '') {
                const num = Number(raw);
                if (!Number.isNaN(num) && num > 0) {
                    parsed[z.key] = Math.round(num * 10) / 10;
                    count++;
                }
            }
        }
        if (count === 0) {
            setError('Ingresa al menos una medida.');
            return;
        }
        setSaving(true);
        await addMeasurementAction(userId, date, parsed);
        setSaving(false);
        onSaved();
    }
    return (<Modal eyebrow="Registro" title="Nueva entrada" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Fecha
          </label>
          <input id="date" type="date" value={date} max={TODAY_ISO} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-input bg-background px-4 py-2.5 text-foreground outline-none focus:border-ring"/>
        </div>

        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Medidas — todas opcionales
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENT_ZONES.map((z) => (<div key={z.key} className="flex flex-col gap-1.5">
                <label htmlFor={z.key} className="text-sm font-medium text-card-foreground">
                  {z.label} <span className="text-muted-foreground">({z.unit})</span>
                </label>
                <input id={z.key} type="number" step="0.1" min="0" inputMode="decimal" placeholder="—" value={values[z.key] ?? ''} onChange={(e) => update(z.key, e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"/>
              </div>))}
          </div>
        </div>

        {error && (<p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>)}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border px-5 py-3 font-heading text-base uppercase tracking-wide text-card-foreground transition-colors hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>);
}
