'use client';
import { useSyncExternalStore } from 'react';
import type { WallpaperChoice } from '@/lib/wallpapers';

/** Per-device preferences, kept in localStorage (they are not tied to the account). */
export interface Preferences {
    /** Default rest target in seconds, or null for a plain stopwatch. */
    restSeconds: number | null;
    vibrate: boolean;
    /** Turns off the edge-refraction effect on glass surfaces (lighter on old devices). */
    reduceEffects: boolean;
    /** 'auto' follows the system theme; any other value is the user's pick and always wins. */
    wallpaper: WallpaperChoice;
}

export const DEFAULT_PREFERENCES: Preferences = { restSeconds: 90, vibrate: true, reduceEffects: false, wallpaper: 'auto' };
const KEY = 'gymbros:prefs';

let cache = DEFAULT_PREFERENCES;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
    if (loaded || typeof window === 'undefined')
        return;
    loaded = true;
    try {
        const raw = localStorage.getItem(KEY);
        if (raw)
            cache = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
    catch { }
}

export function getPreferences(): Preferences {
    load();
    return cache;
}

export function setPreferences(patch: Partial<Preferences>) {
    load();
    cache = { ...cache, ...patch };
    try {
        localStorage.setItem(KEY, JSON.stringify(cache));
    }
    catch { }
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function usePreferences(): Preferences {
    return useSyncExternalStore(subscribe, getPreferences, () => DEFAULT_PREFERENCES);
}
