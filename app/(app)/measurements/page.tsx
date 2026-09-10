import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMeasurements } from '@/services/measurementsService';
import { MeasurementsView } from '@/components/measurements/measurements-view';
export default async function MeasurementsPage() {
    const user = await getCurrentUser();
    if (!user)
        redirect('/login');
    const entries = await getMeasurements(user.id);
    return <MeasurementsView entries={entries}/>;
}
