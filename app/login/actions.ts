'use server';
import { redirect } from 'next/navigation';
import { verifyCredentials } from '@/services/authService';
import { createSession } from '@/lib/auth/session';

// Only same-site relative paths are allowed as post-login destinations.
function safeNext(next?: string): string {
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export async function loginAction(username: string, password: string, next?: string): Promise<{ error?: string }> {
    const user = await verifyCredentials(username, password);
    if (!user) {
        return { error: 'Usuario o contraseña incorrectos.' };
    }
    await createSession(user.id);
    redirect(safeNext(next));
}
