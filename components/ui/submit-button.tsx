'use client';
import { useFormStatus } from 'react-dom';
import { Spinner } from '@/components/ui/spinner';

/** Submit button for <form action={serverAction}> that shows a spinner while the action runs. */
export function SubmitButton({ children, className }: {
    children: React.ReactNode;
    className?: string;
}) {
    const { pending } = useFormStatus();
    return (<button type="submit" disabled={pending} className={`${className ?? ''} disabled:opacity-70`}>
      {pending ? <Spinner/> : null}
      {children}
    </button>);
}
