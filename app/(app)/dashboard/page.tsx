import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMeasurements } from '@/services/measurementsService';
import { getExecutions, getRoutines } from '@/services/exercisesService';
import { getCalories } from '@/services/caloriesService';
import { DashboardView } from '@/components/dashboard/dashboard-view';
export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user)
        redirect('/login');
    const [measurements, executions, calories, routines] = await Promise.all([
        getMeasurements(user.id),
        getExecutions(user.id),
        getCalories(user.id),
        getRoutines(user.id),
    ]);
    return (<DashboardView displayName={user.displayName} measurements={measurements} executions={executions} calories={calories} routines={routines}/>);
}
