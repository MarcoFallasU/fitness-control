interface PageHeaderProps {
    eyebrow: string;
    title: string;
    highlight?: string;
    description?: string;
    action?: React.ReactNode;
}
export function PageHeader({ eyebrow, title, highlight, description, action, }: PageHeaderProps) {
    return (<div className="px-5 pb-2 pt-8 sm:px-8 sm:pt-10 lg:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
            {eyebrow}
          </p>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
            {title}{' '}
            {highlight && <span className="text-brand">{highlight}</span>}
          </h1>
          {description && (<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>)}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>);
}
