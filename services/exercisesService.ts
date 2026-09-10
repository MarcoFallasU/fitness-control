import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { routines, routineGroups, exercises, executions, exerciseExecutions } from '@/lib/db/schema';
import type { Routine, RoutineGroup, Exercise, RoutineExecution, ExerciseExecution } from '@/lib/types';

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

export async function getRoutines(userId: string): Promise<Routine[]> {
    const rows = await db.select().from(routines).where(eq(routines.userId, userId));
    return Promise.all(rows.map(hydrateRoutine));
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

async function hydrateExecution(row: typeof executions.$inferSelect): Promise<RoutineExecution> {
    const exRows = await db.select().from(exerciseExecutions).where(eq(exerciseExecutions.executionId, row.id)).orderBy(exerciseExecutions.position);
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

export async function getExecutions(userId: string): Promise<RoutineExecution[]> {
    const rows = await db.select().from(executions).where(eq(executions.userId, userId));
    const filtered = rows.filter((x) => x.status === 'completed');
    const hydrated = await Promise.all(filtered.map(hydrateExecution));
    return hydrated.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getActiveExecutions(userId: string): Promise<RoutineExecution[]> {
    const rows = await db.select().from(executions).where(eq(executions.userId, userId));
    const filtered = rows.filter((x) => x.status === 'active');
    const hydrated = await Promise.all(filtered.map(hydrateExecution));
    return hydrated.sort((a, b) => b.date.localeCompare(a.date));
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

export async function endTracking(executionId: string): Promise<RoutineExecution | undefined> {
    await db.update(executions).set({ status: 'completed' }).where(eq(executions.id, executionId));
    return getExecution(executionId);
}
