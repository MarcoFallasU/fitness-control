import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Landing } from '@/components/landing/landing';
export default async function HomePage() {
    const user = await getCurrentUser();
    if (user)
        redirect('/dashboard');
    return <Landing />;
}
