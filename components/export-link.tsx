import { Download } from 'lucide-react';

/** Plain download link to one of the /api/export files. */
export function ExportLink({ kind, label = 'Exportar CSV' }: {
    kind: 'measurements' | 'calories' | 'exercises' | 'all';
    label?: string;
}) {
    return (<a href={`/api/export/${kind}`} download className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-ring hover:text-foreground">
      <Download className="size-3.5"/>
      {label}
    </a>);
}
