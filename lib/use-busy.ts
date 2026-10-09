'use client';
import { useCallback, useRef, useState } from 'react';

/**
 * Tracks which async actions are in flight, keyed by name, so each button can show its own spinner.
 * Re-entrant calls with the same key are ignored. If `fn` returns 'keep', the key stays busy
 * (use it when the action ends in a navigation, so the spinner lasts until the page changes).
 */
export function useBusy() {
    const active = useRef(new Set<string>());
    const [, force] = useState(0);
    const run = useCallback(async (key: string, fn: () => Promise<void | 'keep'>) => {
        if (active.current.has(key))
            return;
        active.current.add(key);
        force((n) => n + 1);
        let keep = false;
        try {
            keep = (await fn()) === 'keep';
        }
        finally {
            if (!keep) {
                active.current.delete(key);
                force((n) => n + 1);
            }
        }
    }, []);
    const isBusy = (key: string) => active.current.has(key);
    return { run, isBusy };
}
