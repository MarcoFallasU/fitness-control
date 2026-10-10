export interface User {
    id: string;
    username: string;
    displayName: string;
    color: string;
}
export type MeasurementZone = 'chest' | 'bicepRight' | 'bicepLeft' | 'forearmRight' | 'forearmLeft' | 'quadRight' | 'quadLeft' | 'calfRight' | 'calfLeft' | 'back' | 'shoulders' | 'weight';
export interface MeasurementEntry {
    id: string;
    userId: string;
    date: string;
    values: Partial<Record<MeasurementZone, number>>;
}
export interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    weight: number;
    notes?: string;
}
export interface RoutineGroup {
    id: string;
    userId: string;
    name: string;
}
export interface Routine {
    id: string;
    userId: string;
    name: string;
    description?: string;
    days: string[];
    groupIds: string[];
    exercises: Exercise[];
}
export interface SetDetail {
    reps: number;
    weight: number;
}
export interface ExerciseExecution {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    weight: number;
    notes?: string;
    done?: boolean;
    setDetails?: SetDetail[];
    targetSets: number;
    targetReps: number;
    targetWeight: number;
}
export interface RoutineExecution {
    id: string;
    userId: string;
    routineId: string;
    routineName: string;
    date: string;
    status: 'active' | 'completed';
    exercises: ExerciseExecution[];
}
export interface CalorieEntry {
    id: string;
    userId: string;
    date: string;
    calories: number;
}

/** What the history screens need from a finished exercise, without per-set details. */
export interface HistoryExercise {
    exerciseName: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    weight: number;
}
export interface HistoryExecution {
    id: string;
    routineId: string;
    routineName: string;
    date: string;
    exercises: HistoryExercise[];
}
export interface ActiveExecution {
    id: string;
    routineId: string;
    routineName: string;
    date: string;
    exerciseCount: number;
}
