'use server';
import { redirect } from 'next/navigation';
import { verifyCredentials } from '@/services/authService';
import { createSession } from '@/lib/auth/session';

export async function loginAction(username: string, password: string): Promise<{ error?: string }> {
    const user = await verifyCredentials(username, password);
    if (!user) {
        return { error: 'Usuario o contraseña incorrectos.' };
    }
    await createSession(user.id);
    redirect('/dashboard');
}
