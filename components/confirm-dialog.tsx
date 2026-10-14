'use client';
import { useState } from 'react';
import { Modal } from '@/components/modal';
import { Spinner } from '@/components/ui/spinner';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

/** Asks before a destructive action and shows a spinner while it runs. */
export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onClose }: ConfirmDialogProps) {
    const [busy, setBusy] = useState(false);
    async function confirm() {
        setBusy(true);
        try {
            await onConfirm();
        }
        finally {
            setBusy(false);
            onClose();
        }
    }
    return (<Modal eyebrow="Confirmar" title={title} onClose={busy ? () => { } : onClose}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex gap-2.5">
        <button type="button" disabled={busy} onClick={onClose} className="flex-1 rounded-full border border-border px-5 py-3 text-sm font-bold text-muted-foreground disabled:opacity-60">
          Cancelar
        </button>
        <button type="button" disabled={busy} onClick={confirm} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-destructive px-5 py-3 font-heading text-sm font-extrabold text-white disabled:opacity-70">
          {busy && <Spinner/>}
          {confirmLabel}
        </button>
      </div>
    </Modal>);
}
