'use client';
import { useEffect } from 'react';

export function PwaRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Installability just degrades gracefully without a worker.
            });
        }
    }, []);
    return null;
}
