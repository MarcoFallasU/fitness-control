import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import type { MeasurementZone } from '@/lib/types';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  color: text('color').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const measurements = sqliteTable('measurements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  // Partial<Record<MeasurementZone, number>> stored as JSON — zones are sparse per entry.
  values: text('values', { mode: 'json' }).notNull().$type<Partial<Record<MeasurementZone, number>>>(),
}, (t) => [index('measurements_user_idx').on(t.userId)]);

export const routineGroups = sqliteTable('routine_groups', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
}, (t) => [index('routine_groups_user_idx').on(t.userId)]);

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  days: text('days', { mode: 'json' }).notNull().$type<string[]>(),
  groupIds: text('group_ids', { mode: 'json' }).notNull().$type<string[]>(),
}, (t) => [index('routines_user_idx').on(t.userId)]);

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight').notNull(),
  notes: text('notes'),
  position: integer('position').notNull().default(0),
}, (t) => [index('exercises_routine_idx').on(t.routineId)]);

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  routineName: text('routine_name').notNull(),
  date: text('date').notNull(),
  status: text('status', { enum: ['active', 'completed'] }).notNull(),
}, (t) => [index('executions_user_status_idx').on(t.userId, t.status)]);

export const exerciseExecutions = sqliteTable('exercise_executions', {
  id: text('id').primaryKey(),
  executionId: text('execution_id').notNull().references(() => executions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').notNull(),
  exerciseName: text('exercise_name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight').notNull(),
  notes: text('notes'),
  position: integer('position').notNull().default(0),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  setDetails: text('set_details', { mode: 'json' }).$type<{ reps: number; weight: number }[] | null>(),
  targetSets: integer('target_sets'),
  targetReps: integer('target_reps'),
  targetWeight: real('target_weight'),
}, (t) => [index('exercise_executions_execution_idx').on(t.executionId)]);

export const calories = sqliteTable('calories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  calories: integer('calories').notNull(),
}, (t) => [index('calories_user_date_idx').on(t.userId, t.date)]);

/**
 * One row per exercise of every finished session, with the numbers already
 * worked out. Screens read this instead of re-hydrating whole executions.
 * Written by syncExerciseLog() when a session is closed.
 */
export const exerciseLog = sqliteTable('exercise_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  executionId: text('execution_id').notNull().references(() => executions.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  exerciseName: text('exercise_name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight').notNull(),
  volume: integer('volume').notNull(),
  position: integer('position').notNull().default(0),
}, (t) => [index('exercise_log_user_date_idx').on(t.userId, t.date), index('exercise_log_execution_idx').on(t.executionId)]);
