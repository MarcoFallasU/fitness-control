/** The editable copy a user reviews before adding a shared routine to their account. */
export interface SharedRoutine {
    name: string;
    description?: string;
    exercises: {
        name: string;
        muscleGroup: string;
        sets: number;
        reps: number;
        weight: number;
        notes?: string;
    }[];
}

const MAX_EXERCISES = 60;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, min: number, max: number) => {
    const n = typeof v === 'number' && Number.isFinite(v) ? v : min;
    return Math.min(max, Math.max(min, n));
};

/** Sanitizes untrusted input (it comes back from the browser). Returns null when it is unusable. */
export function sanitizeSharedRoutine(raw: unknown): SharedRoutine | null {
    if (!raw || typeof raw !== 'object')
        return null;
    const r = raw as Record<string, unknown>;
    const name = str(r.name, 80);
    if (!name || !Array.isArray(r.exercises))
        return null;
    const exercises = r.exercises.slice(0, MAX_EXERCISES).flatMap((e: Record<string, unknown>) => {
        const exName = str(e?.name, 80);
        if (!exName)
            return [];
        return [{
                name: exName,
                muscleGroup: str(e.muscleGroup, 40) || 'General',
                sets: Math.round(num(e.sets, 1, 99)),
                reps: Math.round(num(e.reps, 1, 999)),
                weight: num(e.weight, 0, 2000),
                notes: str(e.notes, 300) || undefined,
            }];
    });
    return { name, description: str(r.description, 300) || undefined, exercises };
}
