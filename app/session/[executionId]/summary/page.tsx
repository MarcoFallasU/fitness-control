import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getExecution, getExecutions } from '@/services/exercisesService';
import { buildSummary } from '@/lib/session-summary';
import { SessionSummaryView } from '@/components/exercises/session-summary';

export default async function SessionSummaryPage({ params, searchParams, }: {
    params: Promise<{ executionId: string }>;
    searchParams: Promise<{ t?: string }>;
}) {
    const { executionId } = await params;
    const { t } = await searchParams;
    const me = await getCurrentUser();
    if (!me)
        redirect('/login');
    const execution = await getExecution(executionId);
    if (!execution || execution.userId !== me.id)
        redirect('/exercises');
    if (execution.status === 'active')
        redirect(`/session/${executionId}`);
    const history = await getExecutions(me.id);
    const seconds = t && /^\d+$/.test(t) ? parseInt(t, 10) : undefined;
    return <SessionSummaryView summary={buildSummary(execution, history)} durationSeconds={seconds}/>;
}
