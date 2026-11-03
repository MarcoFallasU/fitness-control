'use client';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface BarItem {
  key: string;
  label: string;
  /** 0..1 of the chart height. */
  height: number;
  /** Text shown above the chart while this bar is selected. */
  readout: string;
  /** `today` is the only yellow; `rest` is an empty stub. */
  tone: 'data' | 'today' | 'rest';
}

const TONE: Record<BarItem['tone'], string> = {
  data: 'var(--blue)',
  today: 'var(--yellow)',
  rest: 'rgba(255,255,255,0.14)',
};

/**
 * Bars you can press or scrub across: the readout follows the pointer from the first touch,
 * and stays on the last bar you reached once you let go.
 */
export function BarChart({ items, heightClass = 'h-28', reference, ariaLabel }: {
  items: BarItem[];
  heightClass?: string;
  /** 0..1 height of a dashed reference line. */
  reference?: number;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  // With nothing selected, rest on today's bar, or the latest one.
  const todayIndex = items.findIndex((i) => i.tone === 'today');
  const shownIndex = active ?? (todayIndex >= 0 ? todayIndex : items.length - 1);
  const shown = items[shownIndex];

  function pick(clientX: number) {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || !items.length)
      return;
    const ratio = (clientX - rect.left) / rect.width;
    setActive(Math.min(items.length - 1, Math.max(0, Math.floor(ratio * items.length))));
  }

  return (<div role="group" aria-label={ariaLabel}>
    <p aria-live="polite" className="min-h-5 font-mono text-xs font-bold text-muted-foreground">
      {shown?.readout}
    </p>
    <div
      ref={track}
      className={cn('relative mt-3 flex touch-pan-y select-none items-end gap-1.5', heightClass)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e.clientX);
      }}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse')
          setActive(null);
      }}
    >
      {reference != null && (<div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/45"
        style={{ bottom: `${Math.min(1, reference) * 100}%` }}
      />)}
      {items.map((item, i) => (<div key={item.key} className="flex h-full flex-1 items-end">
        <div
          aria-hidden
          className="w-full rounded-sm transition-opacity duration-150"
          style={{
            height: `${Math.max(0.04, item.height) * 100}%`,
            background: TONE[item.tone],
            opacity: active != null && active !== i ? 0.45 : 1,
          }}
        />
      </div>))}
    </div>
    <div aria-hidden className="mt-2 flex gap-1.5">
      {items.map((item, i) => (<span
        key={item.key}
        className={cn('flex-1 text-center text-xs transition-colors', i === shownIndex ? 'font-bold text-foreground' : 'text-muted-foreground', item.tone === 'today' && 'text-[var(--yellow)]')}
      >
        {item.label}
      </span>))}
    </div>
  </div>);
}
