import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { routines, routineGroups, exercises, executions, exerciseExecutions, exerciseLog } from '@/lib/db/schema';
import type { Routine, RoutineGroup, Exercise, RoutineExecution, ExerciseExecution, HistoryExecution, ActiveExecution } from '@/lib/types';

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows) {
        const k = key(row);
        const list = map.get(k);
        if (list)
            list.push(row);
        else
            map.set(k, [row]);
    }
    return map;
}

export async function getRoutineGroups(userId: string): Promise<RoutineGroup[]> {
    return db.select().from(routineGroups).where(eq(routineGroups.userId, userId));
}

export async function createRoutineGroup(userId: string, name: string): Promise<RoutineGroup> {
    const group = { id: crypto.randomUUID(), userId, name: name.trim() };
    await db.insert(routineGroups).values(group);
    return group;
}

export async function updateRoutineGroup(groupId: string, name: string): Promise<RoutineGroup | undefined> {
    await db.update(routineGroups).set({ name: name.trim() }).where(eq(routineGroups.id, groupId));
    const rows = await db.select().from(routineGroups).where(eq(routineGroups.id, groupId)).limit(1);
    return rows[0];
}

export async function deleteRoutineGroup(groupId: string): Promise<void> {
    const rows = await db.select().from(routineGroups).where(eq(routineGroups.id, groupId)).limit(1);
    const group = rows[0];
    await db.delete(routineGroups).where(eq(routineGroups.id, groupId));
    if (!group)
        return;
    const userRoutines = await db.select().from(routines).where(eq(routines.userId, group.userId));
    for (const r of userRoutines) {
        if (r.groupIds.includes(groupId)) {
            await db.update(routines).set({ groupIds: r.groupIds.filter((id) => id !== groupId) }).where(eq(routines.id, r.id));
        }
    }
}

export async function setRoutineGroups(routineId: string, groupIds: string[]): Promise<void> {
    await db.update(routines).set({ groupIds: [...groupIds] }).where(eq(routines.id, routineId));
}

async function hydrateRoutine(row: typeof routines.$inferSelect): Promise<Routine> {
    const exerciseRows = await db.select().from(exercises).where(eq(exercises.routineId, row.id)).orderBy(exercises.position);
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        description: row.description ?? undefined,
        days: row.days,
        groupIds: row.groupIds,
        exercises: exerciseRows.map((e) => ({
            id: e.id,
            name: e.name,
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            notes: e.notes ?? undefined,
        })),
    };
}

function toRoutine(row: typeof routines.$inferSelect, exerciseRows: (typeof exercises.$inferSelect)[]): Routine {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        description: row.description ?? undefined,
        days: row.days,
        groupIds: row.groupIds,
        exercises: exerciseRows.map((e) => ({
            id: e.id,
            name: e.name,
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            notes: e.notes ?? undefined,
        })),
    };
}

export async function getRoutines(userId: string): Promise<Routine[]> {
    const [rows, exerciseRows] = await Promise.all([
        db.select().from(routines).where(eq(routines.userId, userId)),
        db.select({ exercise: exercises }).from(exercises).innerJoin(routines, eq(routines.id, exercises.routineId)).where(eq(routines.userId, userId)).orderBy(exercises.position),
    ]);
    const byRoutine = groupBy(exerciseRows.map((r) => r.exercise), (e) => e.routineId);
    return rows.map((r) => toRoutine(r, byRoutine.get(r.id) ?? []));
}

export async function getRoutine(routineId: string): Promise<Routine | undefined> {
    const rows = await db.select().from(routines).where(eq(routines.id, routineId)).limit(1);
    return rows[0] ? hydrateRoutine(rows[0]) : undefined;
}

export async function createRoutine(userId: string, data: {
    name: string;
    description?: string;
    days: string[];
    groupIds?: string[];
}): Promise<Routine> {
    const row = {
        id: crypto.randomUUID(),
        userId,
        name: data.name,
        description: data.description ?? null,
        days: data.days,
        groupIds: data.groupIds ?? [],
    };
    await db.insert(routines).values(row);
    return { ...row, description: row.description ?? undefined, exercises: [] };
}

export async function updateRoutine(routineId: string, data: Partial<Pick<Routine, 'name' | 'description' | 'days' | 'groupIds'>>): Promise<Routine | undefined> {
    await db.update(routines).set(data).where(eq(routines.id, routineId));
    return getRoutine(routineId);
}

export async function deleteRoutine(routineId: string): Promise<void> {
    const executionRows = await db.select({ id: executions.id }).from(executions).where(eq(executions.routineId, routineId));
    const executionIds = executionRows.map((e) => e.id);
    if (executionIds.length) {
        await db.delete(exerciseLog).where(inArray(exerciseLog.executionId, executionIds));
        await db.delete(exerciseExecutions).where(inArray(exerciseExecutions.executionId, executionIds));
        await db.delete(executions).where(inArray(executions.id, executionIds));
    }
    await db.delete(exercises).where(eq(exercises.routineId, routineId));
    await db.delete(routines).where(eq(routines.id, routineId));
}

export async function addExercise(routineId: string, data: Omit<Exercise, 'id'>): Promise<Exercise | undefined> {
    const existing = await db.select().from(exercises).where(eq(exercises.routineId, routineId));
    const exercise = { id: crypto.randomUUID(), routineId, ...data, notes: data.notes ?? null, position: existing.length };
    await db.insert(exercises).values(exercise);
    return { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, sets: exercise.sets, reps: exercise.reps, weight: exercise.weight, notes: exercise.notes ?? undefined };
}

export async function updateExercise(routineId: string, exerciseId: string, data: Partial<Omit<Exercise, 'id'>>): Promise<Exercise | undefined> {
    await db.update(exercises).set(data).where(and(eq(exercises.id, exerciseId), eq(exercises.routineId, routineId)));
    const rows = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).limit(1);
    const row = rows[0];
    return row ? { id: row.id, name: row.name, muscleGroup: row.muscleGroup, sets: row.sets, reps: row.reps, weight: row.weight, notes: row.notes ?? undefined } : undefined;
}

export async function removeExercise(routineId: string, exerciseId: string): Promise<void> {
    await db.delete(exercises).where(and(eq(exercises.id, exerciseId), eq(exercises.routineId, routineId)));
}

function toExecution(row: typeof executions.$inferSelect, exRows: (typeof exerciseExecutions.$inferSelect)[]): RoutineExecution {
    return {
        id: row.id,
        userId: row.userId,
        routineId: row.routineId,
        routineName: row.routineName,
        date: row.date,
        status: row.status,
        exercises: exRows.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            notes: e.notes ?? undefined,
            done: e.done,
            setDetails: e.setDetails ?? undefined,
            targetSets: e.targetSets ?? e.sets,
            targetReps: e.targetReps ?? e.reps,
            targetWeight: e.targetWeight ?? e.weight,
        })),
    };
}

async function hydrateExecution(row: typeof executions.$inferSelect): Promise<RoutineExecution> {
    const exRows = await db.select().from(exerciseExecutions).where(eq(exerciseExecutions.executionId, row.id)).orderBy(exerciseExecutions.position);
    return toExecution(row, exRows);
}

async function loadExecutions(userId: string, status: 'active' | 'completed'): Promise<RoutineExecution[]> {
    const scope = and(eq(executions.userId, userId), eq(executions.status, status));
    const [rows, exRows] = await Promise.all([
        db.select().from(executions).where(scope),
        db.select({ ex: exerciseExecutions }).from(exerciseExecutions).innerJoin(executions, eq(executions.id, exerciseExecutions.executionId)).where(scope).orderBy(exerciseExecutions.position),
    ]);
    const byExecution = groupBy(exRows.map((r) => r.ex), (e) => e.executionId);
    return rows
        .map((r) => toExecution(r, byExecution.get(r.id) ?? []))
        .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getExecutions(userId: string): Promise<RoutineExecution[]> {
    return loadExecutions(userId, 'completed');
}

export async function getActiveExecutions(userId: string): Promise<RoutineExecution[]> {
    return loadExecutions(userId, 'active');
}

/** Active sessions without their exercises (the lists only show how many there are). */
export async function getActiveExecutionSummaries(userId: string): Promise<ActiveExecution[]> {
    const rows = await db.select({
        id: executions.id,
        routineId: executions.routineId,
        routineName: executions.routineName,
        date: executions.date,
        exerciseCount: sql<number>`(select count(*) from exercise_executions ee where ee.execution_id = ${executions.id})`,
    }).from(executions).where(and(eq(executions.userId, userId), eq(executions.status, 'active')));
    return rows.map((r) => ({ ...r, exerciseCount: Number(r.exerciseCount) })).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getExecution(executionId: string): Promise<RoutineExecution | undefined> {
    const rows = await db.select().from(executions).where(eq(executions.id, executionId)).limit(1);
    return rows[0] ? hydrateExecution(rows[0]) : undefined;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export async function startTracking(userId: string, routineId: string): Promise<RoutineExecution | undefined> {
    const routine = await getRoutine(routineId);
    if (!routine)
        return undefined;
    const executionId = crypto.randomUUID();
    await db.insert(executions).values({
        id: executionId,
        userId,
        routineId,
        routineName: routine.name,
        date: todayISO(),
        status: 'active',
    });
    if (routine.exercises.length) {
        await db.insert(exerciseExecutions).values(routine.exercises.map((ex, i) => ({
            id: crypto.randomUUID(),
            executionId,
            exerciseId: ex.id,
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            notes: null,
            position: i,
            done: false,
            setDetails: null,
            targetSets: ex.sets,
            targetReps: ex.reps,
            targetWeight: ex.weight,
        })));
    }
    return getExecution(executionId);
}

export async function updateExecutionExercises(executionId: string, exerciseList: ExerciseExecution[]): Promise<RoutineExecution | undefined> {
    await db.delete(exerciseExecutions).where(eq(exerciseExecutions.executionId, executionId));
    if (exerciseList.length) {
        await db.insert(exerciseExecutions).values(exerciseList.map((ex, i) => ({
            id: crypto.randomUUID(),
            executionId,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            notes: ex.notes ?? null,
            position: i,
            done: ex.done ?? false,
            setDetails: ex.setDetails ?? null,
            targetSets: ex.targetSets ?? ex.sets,
            targetReps: ex.targetReps ?? ex.reps,
            targetWeight: ex.targetWeight ?? ex.weight,
        })));
    }
    return getExecution(executionId);
}

/**
 * Closes a session keeping only the exercises explicitly marked as done, so
 * skipped ones never reach the history, records or progress charts. A session
 * with nothing done is discarded instead of recorded as an empty workout.
 */
export async function endTracking(executionId: string): Promise<RoutineExecution | undefined> {
    await db.delete(exerciseExecutions).where(and(eq(exerciseExecutions.executionId, executionId), eq(exerciseExecutions.done, false)));
    const kept = await db.select({ id: exerciseExecutions.id }).from(exerciseExecutions).where(eq(exerciseExecutions.executionId, executionId)).limit(1);
    if (!kept.length) {
        await db.delete(executions).where(eq(executions.id, executionId));
        return undefined;
    }
    await db.update(executions).set({ status: 'completed' }).where(eq(executions.id, executionId));
    await syncExerciseLog(executionId);
    return getExecution(executionId);
}

function volumeOf(row: typeof exerciseExecutions.$inferSelect): number {
    if (row.setDetails?.length)
        return Math.round(row.setDetails.reduce((acc, set) => acc + set.reps * set.weight, 0));
    return Math.round(row.sets * row.reps * row.weight);
}

/** Rebuilds the log rows of one finished session from its exercise rows. */
export async function syncExerciseLog(executionId: string, options: { includeAll?: boolean } = {}): Promise<void> {
    await db.delete(exerciseLog).where(eq(exerciseLog.executionId, executionId));
    const execRows = await db.select().from(executions).where(eq(executions.id, executionId)).limit(1);
    const execution = execRows[0];
    if (!execution || execution.status !== 'completed')
        return;
    const exRows = await db.select().from(exerciseExecutions).where(eq(exerciseExecutions.executionId, executionId)).orderBy(exerciseExecutions.position);
    const kept = options.includeAll ? exRows : exRows.filter((e) => e.done);
    if (!kept.length)
        return;
    await db.insert(exerciseLog).values(kept.map((e, i) => ({
        id: crypto.randomUUID(),
        userId: execution.userId,
        executionId,
        date: execution.date,
        exerciseName: e.exerciseName,
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        volume: volumeOf(e),
        position: i,
    })));
}

/**
 * One-off backfill for sessions finished before the log existed. Those never had
 * a reliable "done" flag, so every exercise they recorded is kept, as the screens showed.
 */
export async function rebuildExerciseLog(userId?: string): Promise<number> {
    const rows = await db.select({ id: executions.id }).from(executions).where(userId ? and(eq(executions.userId, userId), eq(executions.status, 'completed')) : eq(executions.status, 'completed'));
    for (let i = 0; i < rows.length; i += 10)
        await Promise.all(rows.slice(i, i + 10).map((row) => syncExerciseLog(row.id, { includeAll: true })));
    return rows.length;
}

function toHistory(rows: {
    id: string;
    routineId: string;
    routineName: string;
    date: string;
    exerciseName: string | null;
    muscleGroup: string | null;
    sets: number | null;
    reps: number | null;
    weight: number | null;
}[]): HistoryExecution[] {
    const byId = new Map<string, HistoryExecution>();
    for (const r of rows) {
        let entry = byId.get(r.id);
        if (!entry) {
            entry = { id: r.id, routineId: r.routineId, routineName: r.routineName, date: r.date, exercises: [] };
            byId.set(r.id, entry);
        }
        if (r.exerciseName !== null) {
            entry.exercises.push({ exerciseName: r.exerciseName, muscleGroup: r.muscleGroup ?? '', sets: r.sets ?? 0, reps: r.reps ?? 0, weight: r.weight ?? 0 });
        }
    }
    return Array.from(byId.values());
}

const historyColumns = {
    id: executions.id,
    routineId: executions.routineId,
    routineName: executions.routineName,
    date: executions.date,
    exerciseName: exerciseLog.exerciseName,
    muscleGroup: exerciseLog.muscleGroup,
    sets: exerciseLog.sets,
    reps: exerciseLog.reps,
    weight: exerciseLog.weight,
};

/** Finished sessions with their exercises, newest first, in a single statement. */
export async function getHistory(userId: string): Promise<HistoryExecution[]> {
    const rows = await db.select(historyColumns).from(executions)
        .leftJoin(exerciseLog, eq(exerciseLog.executionId, executions.id))
        .where(and(eq(executions.userId, userId), eq(executions.status, 'completed')))
        .orderBy(desc(executions.date), executions.id, exerciseLog.position);
    return toHistory(rows);
}

export async function getRoutineHistory(userId: string, routineId: string): Promise<HistoryExecution[]> {
    const rows = await db.select(historyColumns).from(executions)
        .leftJoin(exerciseLog, eq(exerciseLog.executionId, executions.id))
        .where(and(eq(executions.userId, userId), eq(executions.routineId, routineId), eq(executions.status, 'completed')))
        .orderBy(desc(executions.date), executions.id, exerciseLog.position);
    return toHistory(rows);
}
