'use client';
import { useEffect } from 'react';
import { attachRefraction } from '@/lib/liquid-glass/refraction';

// Surfaces that get edge refraction. Nested glass is skipped (never nest refracting glass).
const SELECTOR = '.glass, .glass-strong, .glass-nav';

export function LiquidGlassProvider() {
    useEffect(() => {
        const attached = new Map<HTMLElement, () => void>();
        const sync = () => {
            document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
                if (attached.has(el) || el.parentElement?.closest(SELECTOR))
                    return;
                attached.set(el, attachRefraction(el, { blur: el.classList.contains('glass-strong') ? 8 : 1 }));
            });
            attached.forEach((detach, el) => {
                if (!el.isConnected) {
                    detach();
                    attached.delete(el);
                }
            });
        };
        let raf = 0;
        const mo = new MutationObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(sync);
        });
        mo.observe(document.body, { childList: true, subtree: true });
        sync();
        return () => {
            mo.disconnect();
            cancelAnimationFrame(raf);
            attached.forEach((detach) => detach());
            attached.clear();
        };
    }, []);
    return null;
}
