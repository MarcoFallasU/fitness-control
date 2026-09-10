interface SectionCardProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
export function SectionCard({ title, subtitle, action, children, className, }: SectionCardProps) {
    return (<section className={`glass rounded-2xl text-card-foreground ${className ?? ''}`}>
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base font-extrabold">
            {title}
          </h2>
          {subtitle && (<p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>)}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>);
}
