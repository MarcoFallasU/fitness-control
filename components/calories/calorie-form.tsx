'use client';
import { useState } from 'react';
import { Modal } from '@/components/modal';
import { setCaloriesAction } from '@/app/(app)/calories/actions';
import { TODAY_ISO } from '@/lib/format';
interface CalorieFormProps {
    userId: string;
    initialValue?: number;
    onClose: () => void;
    onSaved: () => void;
}
export function CalorieForm({ userId, initialValue, onClose, onSaved }: CalorieFormProps) {
    const [calories, setCals] = useState(String(initialValue ?? ''));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const num = Number(calories);
        if (!calories || Number.isNaN(num) || num <= 0) {
            setError('Ingresa un total de calorías válido.');
            return;
        }
        setSaving(true);
        await setCaloriesAction(userId, TODAY_ISO, Math.round(num));
        setSaving(false);
        onSaved();
    }
    return (<Modal eyebrow={initialValue != null ? 'Editar' : 'Registrar'} title="Calorías de hoy" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="cals" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Calorías totales (kcal)
          </label>
          <input id="cals" type="number" min="0" step="1" inputMode="numeric" autoFocus value={calories} onChange={(e) => setCals(e.target.value)} placeholder="2500" className="rounded-md border border-input bg-background px-4 py-3 font-heading text-2xl text-foreground outline-none focus:border-ring"/>
        </div>

        {error && (<p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>)}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border px-5 py-3 font-heading text-base uppercase tracking-wide transition-colors hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>);
}
