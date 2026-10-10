import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getExercisesPageData } from '@/services/pageDataService';
import { ExercisesView } from '@/components/exercises/exercises-view';
export default async function ExercisesPage() {
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const data = await getExercisesPageData(me);
    return (<ExercisesView me={me} {...data}/>);
}
