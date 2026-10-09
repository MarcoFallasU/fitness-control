import type { Routine } from '@/lib/types';

/** What travels inside a share link. Stateless: the routine is encoded in the URL itself. */
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

function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(data: string): string {
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeSharedRoutine(routine: Routine): string {
    const payload: SharedRoutine = {
        name: routine.name,
        description: routine.description || undefined,
        exercises: routine.exercises.map((e) => ({
            name: e.name,
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            notes: e.notes || undefined,
        })),
    };
    return toBase64Url(JSON.stringify(payload));
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, min: number, max: number) => {
    const n = typeof v === 'number' && Number.isFinite(v) ? v : min;
    return Math.min(max, Math.max(min, n));
};

/** Decodes and sanitizes untrusted input. Returns null when the link is invalid. */
export function decodeSharedRoutine(data: string | undefined): SharedRoutine | null {
    if (!data || data.length > 20000)
        return null;
    try {
        const raw = JSON.parse(fromBase64Url(data));
        const name = str(raw?.name, 80);
        if (!name || !Array.isArray(raw.exercises))
            return null;
        const exercises = raw.exercises.slice(0, MAX_EXERCISES).flatMap((e: Record<string, unknown>) => {
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
        return { name, description: str(raw.description, 300) || undefined, exercises };
    }
    catch {
        return null;
    }
}
