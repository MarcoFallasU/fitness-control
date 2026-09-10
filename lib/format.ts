const MONTHS_ES = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];
export function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]}`;
}
export function formatLongDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function formatMonth(iso: string): string {
    const [y, m] = iso.split('-');
    return `${MONTHS_ES[Number(m) - 1]} ${y.slice(2)}`;
}
export function formatNumber(n: number): string {
    return new Intl.NumberFormat('es-ES').format(n);
}
export function signed(n: number, unit = ''): string {
    const s = n > 0 ? '+' : '';
    return `${s}${n}${unit}`;
}
export const TODAY_ISO = '2026-06-05';
const DAY_MS = 24 * 60 * 60 * 1000;
export function isoDaysAgo(n: number): string {
    const base = new Date(`${TODAY_ISO}T00:00:00Z`);
    return new Date(base.getTime() - n * DAY_MS).toISOString().slice(0, 10);
}
export interface DateRange {
    start: string;
    end: string;
}
