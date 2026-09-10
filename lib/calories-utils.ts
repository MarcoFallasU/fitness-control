import type { CalorieEntry } from '@/lib/types';
import type { DateRange } from '@/lib/format';

function inRange(date: string, range?: DateRange): boolean {
    if (!range)
        return true;
    return date >= range.start && date <= range.end;
}

function sorted(entries: CalorieEntry[], range?: DateRange): CalorieEntry[] {
    return entries.filter((c) => inRange(c.date, range)).sort((a, b) => a.date.localeCompare(b.date));
}

export function findTodayEntry(entries: CalorieEntry[], todayISO: string): CalorieEntry | undefined {
    return entries.find((c) => c.date === todayISO);
}

export function computeAverage(entries: CalorieEntry[], days: number): number {
    const all = sorted(entries);
    const recent = all.slice(-days);
    if (!recent.length)
        return 0;
    return Math.round(recent.reduce((s, c) => s + c.calories, 0) / recent.length);
}

function weekKey(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setUTCDate(diff);
    return monday.toISOString().slice(0, 10);
}

export function computeDailySeries(entries: CalorieEntry[], days: number, range?: DateRange): {
    date: string;
    calories: number;
}[] {
    return sorted(entries, range).slice(-days).map((c) => ({ date: c.date, calories: c.calories }));
}

export function computeWeeklyAverages(entries: CalorieEntry[], weeks: number, range?: DateRange): {
    week: string;
    calories: number;
}[] {
    const all = sorted(entries, range);
    const buckets = new Map<string, number[]>();
    all.forEach((c) => {
        const wk = weekKey(c.date);
        if (!buckets.has(wk))
            buckets.set(wk, []);
        buckets.get(wk)!.push(c.calories);
    });
    const rows = Array.from(buckets.entries())
        .map(([week, vals]) => ({ week, calories: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }))
        .sort((a, b) => a.week.localeCompare(b.week));
    return rows.slice(-weeks);
}

export function computeMonthlyAverages(entries: CalorieEntry[], range?: DateRange): {
    month: string;
    calories: number;
}[] {
    const all = sorted(entries, range);
    const buckets = new Map<string, number[]>();
    all.forEach((c) => {
        const key = c.date.slice(0, 7);
        if (!buckets.has(key))
            buckets.set(key, []);
        buckets.get(key)!.push(c.calories);
    });
    return Array.from(buckets.entries())
        .map(([month, vals]) => ({ month, calories: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

export function computeCalorieComparison(entriesA: CalorieEntry[], entriesB: CalorieEntry[], days: number, range?: DateRange): {
    date: string;
    a: number;
    b: number;
}[] {
    const a = computeDailySeries(entriesA, days, range);
    const b = computeDailySeries(entriesB, days, range);
    const byDate = new Map<string, {
        date: string;
        a: number;
        b: number;
    }>();
    a.forEach((p) => byDate.set(p.date, { date: p.date, a: p.calories, b: 0 }));
    b.forEach((p) => {
        const row = byDate.get(p.date) ?? { date: p.date, a: 0, b: 0 };
        row.b = p.calories;
        byDate.set(p.date, row);
    });
    return Array.from(byDate.values()).sort((x, y) => x.date.localeCompare(y.date));
}
