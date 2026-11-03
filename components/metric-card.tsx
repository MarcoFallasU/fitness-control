import Link from 'next/link';
import { cn } from '@/lib/utils';
interface MetricCardProps {
    label: string;
    value: string;
    unit?: string;
    sub?: string;
    trend?: number;
    accent?: boolean;
    delay?: number;
    /** Makes the whole card a link to the screen the number comes from. */
    href?: string;
}
export function MetricCard({ label, value, unit, sub, trend, accent, delay = 0, href, }: MetricCardProps) {
    const className = cn('animate-rise relative block overflow-hidden rounded-2xl p-5', href && 'press', accent
        ? 'bg-accent text-accent-foreground'
        : 'glass text-card-foreground');
    const content = (<>
      <p className={cn('text-[11px] font-bold uppercase tracking-[0.1em]', accent ? 'text-accent-foreground/70' : 'text-muted-foreground')}>
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold leading-none tracking-[-0.03em] tabular-nums">
          {value}
        </span>
        {unit && (<span className="text-sm font-semibold opacity-60">{unit}</span>)}
      </div>
      {sub && (<p className={cn('mt-2 text-xs font-semibold', trend == null
            ? accent
                ? 'text-accent-foreground/70'
                : 'text-muted-foreground'
            : trend >= 0
                ? 'text-[var(--lime)]'
                : 'text-destructive')}>
          {sub}
        </p>)}
    </>);
    const style = { animationDelay: `${delay}ms` };
    if (href)
        return <Link href={href} className={className} style={style}>{content}</Link>;
    return <div className={className} style={style}>{content}</div>;
}
