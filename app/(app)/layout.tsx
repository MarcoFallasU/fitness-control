import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AuthProvider } from '@/context/auth-context';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (!user)
        redirect('/login');
    return (<AuthProvider user={user}>
      <AppShell>{children}</AppShell>
    </AuthProvider>);
}
