'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
interface ModalProps {
    title: string;
    eyebrow?: string;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'md' | 'lg';
}
export function Modal({ title, eyebrow, onClose, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape')
                onClose();
        }
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);
    return (<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden/>
      <div role="dialog" aria-modal="true" className={`glass-strong animate-rise relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl text-card-foreground shadow-[var(--shadow-pop)] sm:rounded-3xl ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            {eyebrow && (<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                {eyebrow}
              </p>)}
            <h2 className="font-heading text-xl font-extrabold">
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 transition-colors hover:bg-sidebar-accent" aria-label="Cerrar">
            <X className="size-5"/>
          </button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>);
}
