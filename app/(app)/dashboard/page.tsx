import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDashboardData } from '@/services/pageDataService';
import { DashboardView } from '@/components/dashboard/dashboard-view';
export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user)
        redirect('/login');
    const data = await getDashboardData(user);
    return (<DashboardView displayName={user.displayName} {...data}/>);
}
