import { cn } from '@/lib/utils';

/** Small circular loader that inherits the surrounding text color. */
export function Spinner({ className }: {
    className?: string;
}) {
    return (<span role="status" aria-label="Cargando" className={cn('inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent', className)}/>);
}
