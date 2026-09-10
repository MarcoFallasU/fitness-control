import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getAllUsers } from '@/services/authService';
import { getRoutines, getRoutineGroups, getExecutions, getActiveExecutions, } from '@/services/exercisesService';
import { ExercisesView } from '@/components/exercises/exercises-view';
export default async function ExercisesPage() {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const [users, routines, groups, executions, activeExecutions] = await Promise.all([
        getAllUsers(),
        getRoutines(me.id),
        getRoutineGroups(me.id),
        getExecutions(me.id),
        getActiveExecutions(me.id),
    ]);
    const other = users.find((u) => u.id !== me.id);
    const [otherExecutions, otherActiveExecutions] = other
        ? await Promise.all([getExecutions(other.id), getActiveExecutions(other.id)])
        : [[], []];
    return (<ExercisesView me={me} other={other} routines={routines} groups={groups} executions={executions} activeExecutions={activeExecutions} otherExecutions={otherExecutions} otherActiveExecutions={otherActiveExecutions}/>);
}
