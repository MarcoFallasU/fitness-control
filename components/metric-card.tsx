import { cn } from '@/lib/utils';
interface MetricCardProps {
    label: string;
    value: string;
    unit?: string;
    sub?: string;
    trend?: number;
    accent?: boolean;
    delay?: number;
}
export function MetricCard({ label, value, unit, sub, trend, accent, delay = 0, }: MetricCardProps) {
    return (<div className={cn('animate-rise relative overflow-hidden rounded-2xl p-5', accent
            ? 'bg-accent text-accent-foreground'
            : 'glass text-card-foreground')} style={{ animationDelay: `${delay}ms` }}>
      <p className={cn('text-xs font-bold uppercase tracking-[0.15em]', accent ? 'text-accent-foreground/70' : 'text-muted-foreground')}>
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
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
    </div>);
}
