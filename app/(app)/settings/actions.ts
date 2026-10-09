'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import * as auth from '@/services/authService';

export async function updateProfileAction(displayName: string, color: string): Promise<{ error?: string }> {
    const me = await getCurrentUser();
    if (!me)
        return { error: 'Sesión expirada.' };
    const name = displayName.trim();
    if (!name || name.length > 30)
        return { error: 'El nombre debe tener entre 1 y 30 caracteres.' };
    if (!/^#[0-9a-fA-F]{6}$/.test(color))
        return { error: 'Color no válido.' };
    await auth.updateProfile(me.id, { displayName: name, color });
    // The user shows in the layout, partner views and charts, so refresh everything.
    revalidatePath('/', 'layout');
    return {};
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
    const me = await getCurrentUser();
    if (!me)
        return { error: 'Sesión expirada.' };
    if (newPassword.length < 6)
        return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    if (newPassword === currentPassword)
        return { error: 'La nueva contraseña debe ser distinta a la actual.' };
    const ok = await auth.changePassword(me.id, currentPassword, newPassword);
    return ok ? {} : { error: 'La contraseña actual es incorrecta.' };
}
