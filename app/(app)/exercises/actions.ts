'use server';
import { revalidatePath } from 'next/cache';
import * as svc from '@/services/exercisesService';
import type { Routine, RoutineGroup, Exercise, RoutineExecution, ExerciseExecution } from '@/lib/types';

function refresh() {
    revalidatePath('/exercises');
    revalidatePath('/dashboard');
}

export async function createRoutineGroupAction(userId: string, name: string): Promise<RoutineGroup> {
    const group = await svc.createRoutineGroup(userId, name);
    refresh();
    return group;
}

export async function updateRoutineGroupAction(groupId: string, name: string): Promise<RoutineGroup | undefined> {
    const group = await svc.updateRoutineGroup(groupId, name);
    refresh();
    return group;
}

export async function deleteRoutineGroupAction(groupId: string): Promise<void> {
    await svc.deleteRoutineGroup(groupId);
    refresh();
}

export async function createRoutineAction(userId: string, data: {
    name: string;
    description?: string;
    days: string[];
    groupIds?: string[];
}): Promise<Routine> {
    const routine = await svc.createRoutine(userId, data);
    refresh();
    return routine;
}

export async function updateRoutineAction(routineId: string, data: Partial<Pick<Routine, 'name' | 'description' | 'days' | 'groupIds'>>): Promise<void> {
    await svc.updateRoutine(routineId, data);
    refresh();
}

export async function deleteRoutineAction(routineId: string): Promise<void> {
    await svc.deleteRoutine(routineId);
    refresh();
}

export async function addExerciseAction(routineId: string, data: Omit<Exercise, 'id'>): Promise<void> {
    await svc.addExercise(routineId, data);
    refresh();
}

export async function updateExerciseAction(routineId: string, exerciseId: string, data: Partial<Omit<Exercise, 'id'>>): Promise<void> {
    await svc.updateExercise(routineId, exerciseId, data);
    refresh();
}

export async function removeExerciseAction(routineId: string, exerciseId: string): Promise<void> {
    await svc.removeExercise(routineId, exerciseId);
    refresh();
}

export async function startTrackingAction(userId: string, routineId: string): Promise<RoutineExecution | undefined> {
    const execution = await svc.startTracking(userId, routineId);
    refresh();
    return execution;
}

export async function endTrackingAction(executionId: string): Promise<void> {
    await svc.endTracking(executionId);
    refresh();
}

export async function updateExecutionExercisesAction(executionId: string, exerciseList: ExerciseExecution[]): Promise<void> {
    await svc.updateExecutionExercises(executionId, exerciseList);
    refresh();
}

export async function finalizeExecutionAction(executionId: string, exerciseList: ExerciseExecution[]): Promise<void> {
    await svc.updateExecutionExercises(executionId, exerciseList);
    await svc.endTracking(executionId);
    refresh();
}
