import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getExecution } from '@/services/exercisesService';
import { SessionView } from '@/components/exercises/session-view';

export default async function SessionPage({ params }: { params: Promise<{ executionId: string }> }) {
    const { executionId } = await params;
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const execution = await getExecution(executionId);
    if (!execution || execution.userId !== me.id || execution.status !== 'active')
        redirect('/exercises');
    return <SessionView execution={execution} me={me}/>;
}
