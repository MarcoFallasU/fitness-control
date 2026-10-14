import { getCurrentUser } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';
import { MEASUREMENT_ZONES } from '@/lib/measurements-utils';
import { getMeasurements } from '@/services/measurementsService';
import { getCalories } from '@/services/caloriesService';
import { getExerciseExportRows } from '@/services/exercisesService';

const KINDS = ['measurements', 'calories', 'exercises', 'all'] as const;
type Kind = typeof KINDS[number];

const FILE_LABEL: Record<Exclude<Kind, 'all'>, string> = {
    measurements: 'medidas',
    calories: 'calorias',
    exercises: 'ejercicios',
};

function download(body: string, type: string, filename: string): Response {
    return new Response(body, {
        headers: {
            'Content-Type': `${type}; charset=utf-8`,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}

/** Exports the signed-in user's own records. Never reads anyone else's. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
    const user = await getCurrentUser();
    if (!user)
        return new Response('No autorizado', { status: 401 });
    const { kind } = await params;
    if (!KINDS.includes(kind as Kind))
        return new Response('Tipo de exportación no válido', { status: 404 });

    const stamp = new Date().toISOString().slice(0, 10);
    const file = (k: Kind, ext: string) => `gymbros-${k === 'all' ? 'todo' : FILE_LABEL[k]}-${stamp}.${ext}`;

    if (kind === 'measurements') {
        const entries = await getMeasurements(user.id);
        const headers = ['Fecha', ...MEASUREMENT_ZONES.map((z) => `${z.label} (${z.unit})`)];
        const rows = entries.map((e) => [e.date, ...MEASUREMENT_ZONES.map((z) => e.values[z.key] ?? '')]);
        return download(toCsv(headers, rows), 'text/csv', file('measurements', 'csv'));
    }
    if (kind === 'calories') {
        const entries = await getCalories(user.id);
        return download(toCsv(['Fecha', 'Calorías (kcal)'], entries.map((c) => [c.date, c.calories])), 'text/csv', file('calories', 'csv'));
    }
    if (kind === 'exercises') {
        const rows = await getExerciseExportRows(user.id);
        const headers = ['Fecha', 'Rutina', 'Ejercicio', 'Grupo muscular', 'Series', 'Reps', 'Peso (kg)', 'Volumen (kg)'];
        return download(toCsv(headers, rows.map((r) => [r.date, r.routine, r.exercise, r.muscleGroup, r.sets, r.reps, r.weight, r.volume])), 'text/csv', file('exercises', 'csv'));
    }

    const [measurements, calories, exercises] = await Promise.all([
        getMeasurements(user.id),
        getCalories(user.id),
        getExerciseExportRows(user.id),
    ]);
    const payload = {
        exportedAt: new Date().toISOString(),
        user: { username: user.username, displayName: user.displayName },
        measurements: measurements.map((e) => ({ date: e.date, ...e.values })),
        calories: calories.map((c) => ({ date: c.date, calories: c.calories })),
        exercises,
    };
    return download(JSON.stringify(payload, null, 2), 'application/json', file('all', 'json'));
}
