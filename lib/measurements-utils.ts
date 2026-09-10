import type { MeasurementEntry, MeasurementZone } from '@/lib/types';
import type { DateRange } from '@/lib/format';

export const MEASUREMENT_ZONES: {
    key: MeasurementZone;
    label: string;
    unit: 'cm' | 'kg';
}[] = [
    { key: 'chest', label: 'Pecho', unit: 'cm' },
    { key: 'bicepRight', label: 'Bíceps Derecho', unit: 'cm' },
    { key: 'bicepLeft', label: 'Bíceps Izquierdo', unit: 'cm' },
    { key: 'forearmRight', label: 'Antebrazo Derecho', unit: 'cm' },
    { key: 'forearmLeft', label: 'Antebrazo Izquierdo', unit: 'cm' },
    { key: 'quadRight', label: 'Cuádriceps Derecho', unit: 'cm' },
    { key: 'quadLeft', label: 'Cuádriceps Izquierdo', unit: 'cm' },
    { key: 'calfRight', label: 'Pantorrilla Derecha', unit: 'cm' },
    { key: 'calfLeft', label: 'Pantorrilla Izquierda', unit: 'cm' },
    { key: 'back', label: 'Espalda', unit: 'cm' },
    { key: 'shoulders', label: 'Hombro', unit: 'cm' },
    { key: 'weight', label: 'Peso', unit: 'kg' },
];

export const CHART_ZONES = MEASUREMENT_ZONES.filter((z) => z.unit === 'cm');

export function zoneLabel(zone: MeasurementZone): string {
    return MEASUREMENT_ZONES.find((z) => z.key === zone)?.label ?? zone;
}

export function zoneUnit(zone: MeasurementZone): 'cm' | 'kg' {
    return MEASUREMENT_ZONES.find((z) => z.key === zone)?.unit ?? 'cm';
}

function inRange(date: string, range?: DateRange): boolean {
    if (!range)
        return true;
    return date >= range.start && date <= range.end;
}

export interface ZoneDelta {
    zone: MeasurementZone;
    label: string;
    first: number | null;
    last: number | null;
    delta: number | null;
    pct: number | null;
}

export function computeZoneDeltas(allEntries: MeasurementEntry[], range?: DateRange): ZoneDelta[] {
    const entries = allEntries.filter((e) => inRange(e.date, range)).sort((a, b) => a.date.localeCompare(b.date));
    return MEASUREMENT_ZONES.map(({ key, label }) => {
        const withZone = entries.filter((e) => e.values[key] != null);
        const first = withZone.length ? withZone[0].values[key]! : null;
        const last = withZone.length ? withZone[withZone.length - 1].values[key]! : null;
        const delta = first != null && last != null ? Math.round((last - first) * 10) / 10 : null;
        const pct = first != null && last != null && first !== 0
            ? Math.round(((last - first) / first) * 1000) / 10
            : null;
        return { zone: key, label, first, last, delta, pct };
    });
}

export function computeZoneSeries(allEntries: MeasurementEntry[], zones: MeasurementZone[], range?: DateRange): {
    date: string;
    [zone: string]: number | string;
}[] {
    const entries = allEntries.filter((e) => inRange(e.date, range)).sort((a, b) => a.date.localeCompare(b.date));
    return entries.map((e) => {
        const row: {
            date: string;
            [zone: string]: number | string;
        } = { date: e.date };
        zones.forEach((z) => {
            if (e.values[z] != null)
                row[z] = e.values[z]!;
        });
        return row;
    });
}
