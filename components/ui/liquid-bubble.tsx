'use client';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

interface BubbleBox {
    l: number;
    t: number;
    w: number;
    h: number;
    sx: number;
    sy: number;
}

const EASE = 'cubic-bezier(.3,1.5,.5,1)';

/**
 * Liquid bubble indicator: stretches from the old item to the new one, then settles with a squash.
 * The container must be positioned (relative) and every item needs `data-lg-item="<key>"`.
 * Measured from the DOM, so items can have any size.
 */
export function useLiquidBubble(containerRef: RefObject<HTMLElement | null>, activeKey: string | null, axis: 'x' | 'y' = 'x') {
    const [box, setBox] = useState<BubbleBox | null>(null);
    const settled = useRef<Pick<BubbleBox, 'l' | 't' | 'w' | 'h'> | null>(null);
    const keyRef = useRef(activeKey);
    keyRef.current = activeKey;

    const measure = (key: string | null) => {
        const c = containerRef.current;
        if (!c || key == null)
            return null;
        const el = Array.from(c.querySelectorAll<HTMLElement>('[data-lg-item]')).find((n) => n.dataset.lgItem === key);
        return el ? { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null;
    };

    useLayoutEffect(() => {
        const target = measure(activeKey);
        if (!target) {
            settled.current = null;
            setBox(null);
            return;
        }
        const from = settled.current;
        settled.current = target;
        if (!from || (from.l === target.l && from.t === target.t && from.w === target.w && from.h === target.h)) {
            setBox({ ...target, sx: 1, sy: 1 });
            return;
        }
        // Phase 1: stretch across both items. Phase 2: land on the target with a small overshoot. Phase 3: settle.
        const l = Math.min(from.l, target.l);
        const t = Math.min(from.t, target.t);
        const r = Math.max(from.l + from.w, target.l + target.w);
        const b = Math.max(from.t + from.h, target.t + target.h);
        setBox({ l, t, w: r - l, h: b - t, sx: axis === 'y' ? 0.78 : 1, sy: axis === 'x' ? 0.78 : 1 });
        let t2: ReturnType<typeof setTimeout>;
        const t1 = setTimeout(() => {
            setBox({ ...target, sx: 1.06, sy: 1.08 });
            t2 = setTimeout(() => setBox({ ...target, sx: 1, sy: 1 }), 170);
        }, 150);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeKey]);

    // Keep the bubble glued to its item when the layout changes (resize, font load).
    useEffect(() => {
        const c = containerRef.current;
        if (!c)
            return;
        const ro = new ResizeObserver(() => {
            const target = measure(keyRef.current);
            if (!target)
                return;
            settled.current = target;
            setBox({ ...target, sx: 1, sy: 1 });
        });
        ro.observe(c);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return box;
}

// No backdrop-filter on purpose: a parent with backdrop-filter is a backdrop root,
// so a nested one would only see the parent's (empty) content.
export function LiquidBubble({ box, radius = 999 }: {
    box: BubbleBox | null;
    radius?: number | string;
}) {
    if (!box)
        return null;
    return (<span aria-hidden style={{
            position: 'absolute', left: box.l, top: box.t, width: box.w, height: box.h, boxSizing: 'border-box',
            transform: `scale(${box.sx},${box.sy})`, borderRadius: radius, pointerEvents: 'none',
            background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.45)',
            boxShadow: 'inset 1.5px 1.5px 1px rgba(255,255,255,.85), inset -1px -1px 1px rgba(255,255,255,.4), inset 0 0 14px rgba(255,255,255,.25), 0 6px 16px rgba(0,0,0,.15)',
            transition: `left .34s ${EASE}, top .34s ${EASE}, width .34s ${EASE}, height .34s ${EASE}, transform .3s cubic-bezier(.3,1.8,.5,1)`,
        }}/>);
}
