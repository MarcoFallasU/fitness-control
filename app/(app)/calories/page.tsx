import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getAllUsers } from '@/services/authService';
import { getCalories } from '@/services/caloriesService';
import { CaloriesView } from '@/components/calories/calories-view';
export default async function CaloriesPage() {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const users = await getAllUsers();
    const other = users.find((u) => u.id !== me.id);
    const [entries, otherEntries] = await Promise.all([
        getCalories(me.id),
        other ? getCalories(other.id) : Promise.resolve([]),
    ]);
    return <CaloriesView me={me} other={other} entries={entries} otherEntries={otherEntries}/>;
}
