import { getAllUsers } from '@/services/authService';
import { getMeasurements } from '@/services/measurementsService';
import { getCalories } from '@/services/caloriesService';
import { getActiveExecutionSummaries, getHistory, getRoutineGroups, getRoutines } from '@/services/exercisesService';
import { buildExerciseStats, countExecutionsThisMonth } from '@/lib/exercises-utils';
import type { User } from '@/lib/types';

/**
 * Everything a page needs is requested in one parallel batch, and anything that
 * is a calculation (records, progress, counts) is reduced here so the browser
 * only receives the result, never the raw history.
 */

export async function getDashboardData(user: User) {
    const [measurements, history, calories, routines] = await Promise.all([
        getMeasurements(user.id),
        getHistory(user.id),
        getCalories(user.id),
        getRoutines(user.id),
    ]);
    const stats = buildExerciseStats(history);
    return {
        measurements,
        calories,
        routines,
        prTable: stats.prTable,
        sessionsThisMonth: countExecutionsThisMonth(history),
        sessionDates: Array.from(new Set(history.map((x) => x.date))),
    };
}

export async function getExercisesPageData(me: User) {
    const users = await getAllUsers();
    const other = users.find((u) => u.id !== me.id);
    const [routines, groups, history, activeExecutions, otherHistory, otherActiveExecutions] = await Promise.all([
        getRoutines(me.id),
        getRoutineGroups(me.id),
        getHistory(me.id),
        getActiveExecutionSummaries(me.id),
        other ? getHistory(other.id) : Promise.resolve([]),
        other ? getActiveExecutionSummaries(other.id) : Promise.resolve([]),
    ]);
    const completedCounts: Record<string, number> = {};
    history.forEach((x) => {
        completedCounts[x.routineId] = (completedCounts[x.routineId] ?? 0) + 1;
    });
    return {
        other,
        routines,
        groups,
        completedCounts,
        activeExecutions,
        otherActiveExecutions,
        stats: buildExerciseStats(history),
        otherPoints: buildExerciseStats(otherHistory).points,
    };
}
