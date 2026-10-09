import type { ExerciseExecution, RoutineExecution } from '@/lib/types';

export type Trend = 'up' | 'down' | 'same' | 'new';

export interface ExerciseSummary {
    exerciseName: string;
    muscleGroup: string;
    done: boolean;
    sets: number;
    topWeight: number;
    volume: number;
    prevTopWeight?: number;
    prevVolume?: number;
    volumeDeltaPct?: number;
    trend: Trend;
    isPR: boolean;
}

export interface SessionSummary {
    routineName: string;
    date: string;
    doneCount: number;
    total: number;
    totalVolume: number;
    prevVolume?: number;
    volumeDeltaPct?: number;
    trend: Trend;
    improved: number;
    worse: number;
    same: number;
    prCount: number;
    prevDate?: string;
    exercises: ExerciseSummary[];
}

/** Total kg moved, honoring per-set details when the user filled them in. */
export function exerciseTotalVolume(ex: ExerciseExecution): number {
    if (ex.setDetails?.length)
        return Math.round(ex.setDetails.reduce((acc, s) => acc + s.reps * s.weight, 0));
    return Math.round(ex.sets * ex.reps * ex.weight);
}

export function exerciseTopWeight(ex: ExerciseExecution): number {
    if (ex.setDetails?.length)
        return Math.max(...ex.setDetails.map((s) => s.weight));
    return ex.weight;
}

// Changes under 1% are treated as "same" to avoid noise.
function trendOf(current: number, previous: number | undefined): { trend: Trend; pct?: number } {
    if (previous === undefined || previous <= 0)
        return { trend: 'new' };
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct * 10) / 10;
    return { trend: Math.abs(pct) < 1 ? 'same' : pct > 0 ? 'up' : 'down', pct: rounded };
}

export function buildSummary(execution: RoutineExecution, history: RoutineExecution[]): SessionSummary {
    const others = history.filter((x) => x.id !== execution.id && x.status === 'completed');
    const sameRoutine = others
        .filter((x) => x.routineId === execution.routineId && x.date <= execution.date)
        .sort((a, b) => b.date.localeCompare(a.date));
    const prev = sameRoutine[0];

    const exercises: ExerciseSummary[] = execution.exercises.map((ex) => {
        const volume = exerciseTotalVolume(ex);
        const topWeight = exerciseTopWeight(ex);
        const prevEx = prev?.exercises.find((p) => p.exerciseName === ex.exerciseName);
        const prevVolume = prevEx ? exerciseTotalVolume(prevEx) : undefined;
        const { trend, pct } = trendOf(volume, prevVolume);
        let bestBefore = 0;
        others.forEach((x) => x.exercises.forEach((e) => {
            if (e.exerciseName === ex.exerciseName)
                bestBefore = Math.max(bestBefore, exerciseTopWeight(e));
        }));
        return {
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            done: !!ex.done,
            sets: ex.setDetails?.length || ex.sets,
            topWeight,
            volume,
            prevTopWeight: prevEx ? exerciseTopWeight(prevEx) : undefined,
            prevVolume,
            volumeDeltaPct: pct,
            trend,
            isPR: bestBefore > 0 && topWeight > bestBefore,
        };
    });

    const totalVolume = exercises.reduce((a, e) => a + e.volume, 0);
    // Compare totals only over exercises present in both sessions, so adding or removing an exercise does not skew it.
    const comparable = exercises.filter((e) => e.prevVolume !== undefined);
    const prevVolume = comparable.length ? comparable.reduce((a, e) => a + (e.prevVolume ?? 0), 0) : undefined;
    const currentComparable = comparable.reduce((a, e) => a + e.volume, 0);
    const overall = trendOf(currentComparable, prevVolume);

    return {
        routineName: execution.routineName,
        date: execution.date,
        doneCount: execution.exercises.filter((e) => e.done).length,
        total: execution.exercises.length,
        totalVolume,
        prevVolume,
        volumeDeltaPct: overall.pct,
        trend: overall.trend,
        improved: exercises.filter((e) => e.trend === 'up').length,
        worse: exercises.filter((e) => e.trend === 'down').length,
        same: exercises.filter((e) => e.trend === 'same').length,
        prCount: exercises.filter((e) => e.isPR).length,
        prevDate: prev?.date,
        exercises,
    };
}
