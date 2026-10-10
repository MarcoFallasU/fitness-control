import type { ExerciseExecution, HistoryExercise } from '@/lib/types';
import type { DateRange } from '@/lib/format';

/** Anything with a date and the few exercise fields the history screens read (full or slim executions). */
export interface HistoryLike {
    date: string;
    exercises: Pick<HistoryExercise, 'exerciseName' | 'muscleGroup' | 'weight'>[];
}

export function computeExerciseVolume(ex: Pick<ExerciseExecution, 'sets' | 'reps' | 'weight'>): number {
    return Math.round(ex.sets * ex.reps * ex.weight);
}

function inRange(date: string, range?: DateRange): boolean {
    if (!range)
        return true;
    return date >= range.start && date <= range.end;
}

export interface ExerciseProgressPoint {
    date: string;
    weight: number;
}

export function computeExerciseProgress(executions: HistoryLike[], exerciseName: string, range?: DateRange): ExerciseProgressPoint[] {
    const points: ExerciseProgressPoint[] = [];
    executions.filter((x) => inRange(x.date, range)).forEach((x) => {
        const matches = x.exercises.filter((e) => e.exerciseName === exerciseName);
        if (!matches.length)
            return;
        const maxWeight = Math.max(...matches.map((e) => e.weight));
        points.push({ date: x.date, weight: maxWeight });
    });
    return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function computePR(executions: HistoryLike[], exerciseName: string): number {
    const progress = computeExerciseProgress(executions, exerciseName);
    return progress.length ? Math.max(...progress.map((p) => p.weight)) : 0;
}

export function computeExerciseNames(executions: HistoryLike[]): string[] {
    const names = new Set<string>();
    executions.forEach((x) => x.exercises.forEach((e) => names.add(e.exerciseName)));
    return Array.from(names).sort();
}

export interface PRRow {
    exerciseName: string;
    muscleGroup: string;
    pr: number;
    first: number;
    pct: number;
}

export function computePRTable(executions: HistoryLike[], range?: DateRange): PRRow[] {
    const sorted = executions.filter((x) => inRange(x.date, range)).sort((a, b) => a.date.localeCompare(b.date));
    const rows: Record<string, PRRow> = {};
    sorted.forEach((x) => {
        x.exercises.forEach((e) => {
            if (e.weight <= 0)
                return;
            if (!rows[e.exerciseName]) {
                rows[e.exerciseName] = { exerciseName: e.exerciseName, muscleGroup: e.muscleGroup, pr: e.weight, first: e.weight, pct: 0 };
            }
            else {
                rows[e.exerciseName].pr = Math.max(rows[e.exerciseName].pr, e.weight);
            }
        });
    });
    return Object.values(rows)
        .map((r) => ({ ...r, pct: r.first ? Math.round(((r.pr - r.first) / r.first) * 1000) / 10 : 0 }))
        .sort((a, b) => b.pr - a.pr);
}

export function computeExerciseComparison(executionsA: HistoryLike[], executionsB: HistoryLike[], exerciseName: string, range?: DateRange): {
    date: string;
    a?: number;
    b?: number;
}[] {
    const a = computeExerciseProgress(executionsA, exerciseName, range);
    const b = computeExerciseProgress(executionsB, exerciseName, range);
    return mergeByDate(a, b);
}

function mergeByDate(a: ExerciseProgressPoint[], b: ExerciseProgressPoint[]): {
    date: string;
    a?: number;
    b?: number;
}[] {
    const byDate = new Map<string, {
        date: string;
        a?: number;
        b?: number;
    }>();
    a.forEach((p) => byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), a: p.weight }));
    b.forEach((p) => byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), b: p.weight }));
    return Array.from(byDate.values()).sort((x, y) => x.date.localeCompare(y.date));
}

export function countExecutionsThisMonth(executions: Pick<HistoryLike, 'date'>[]): number {
    const now = new Date();
    const m = now.getUTCMonth();
    const y = now.getUTCFullYear();
    return executions.filter((x) => {
        const d = new Date(x.date);
        return d.getUTCMonth() === m && d.getUTCFullYear() === y;
    }).length;
}

// ---- Server-side summary: the history is reduced here and only the result is sent to the browser ----

/** Best weight of one exercise in one session. */
export interface ProgressPoint {
    exerciseName: string;
    date: string;
    weight: number;
}

export interface ExerciseStats {
    names: string[];
    prTable: PRRow[];
    points: ProgressPoint[];
}

export function buildExerciseStats(history: HistoryLike[]): ExerciseStats {
    const points: ProgressPoint[] = [];
    history.forEach((x) => {
        const best = new Map<string, number>();
        x.exercises.forEach((e) => best.set(e.exerciseName, Math.max(best.get(e.exerciseName) ?? -Infinity, e.weight)));
        best.forEach((weight, exerciseName) => points.push({ exerciseName, date: x.date, weight }));
    });
    points.sort((a, b) => a.date.localeCompare(b.date));
    return { names: computeExerciseNames(history), prTable: computePRTable(history), points };
}

export function pointsToProgress(points: ProgressPoint[], exerciseName: string): ExerciseProgressPoint[] {
    return points
        .filter((p) => p.exerciseName === exerciseName)
        .map((p) => ({ date: p.date, weight: p.weight }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export function pointsToComparison(mine: ProgressPoint[], theirs: ProgressPoint[], exerciseName: string): {
    date: string;
    a?: number;
    b?: number;
}[] {
    return mergeByDate(pointsToProgress(mine, exerciseName), pointsToProgress(theirs, exerciseName));
}

export function pointsToPR(points: ProgressPoint[], exerciseName: string): number {
    const own = pointsToProgress(points, exerciseName);
    return own.length ? Math.max(...own.map((p) => p.weight)) : 0;
}
