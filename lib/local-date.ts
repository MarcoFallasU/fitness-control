'use client';
import { useSyncExternalStore } from 'react';

export const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Calendar date (YYYY-MM-DD) in the device's own timezone, unlike `toISOString()` which is always UTC. */
export function localISODate(d = new Date()): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

export function lastNLocalDates(n: number): string[] {
    const out: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        out.push(localISODate(d));
    }
    return out;
}

export function dayAbbr(iso: string): string {
    return DAY_ABBR[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

const subscribe = () => () => { };

/** Today's local date, or null while rendering on the server (its timezone is not the user's). */
export function useToday(): string | null {
    return useSyncExternalStore(subscribe, () => localISODate(), () => null);
}
