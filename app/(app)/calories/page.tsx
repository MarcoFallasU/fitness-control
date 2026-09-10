import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getAllUsers } from '@/services/authService';
import { getCalories } from '@/services/caloriesService';
import { CaloriesView } from '@/components/calories/calories-view';
export default async function CaloriesPage() {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const [users, entries] = await Promise.all([getAllUsers(), getCalories(me.id)]);
    const other = users.find((u) => u.id !== me.id);
    const otherEntries = other ? await getCalories(other.id) : [];
    return <CaloriesView me={me} other={other} entries={entries} otherEntries={otherEntries}/>;
}
