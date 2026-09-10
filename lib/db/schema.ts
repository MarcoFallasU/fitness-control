import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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
});

export const routineGroups = sqliteTable('routine_groups', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  days: text('days', { mode: 'json' }).notNull().$type<string[]>(),
  groupIds: text('group_ids', { mode: 'json' }).notNull().$type<string[]>(),
});

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
});

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  routineName: text('routine_name').notNull(),
  date: text('date').notNull(),
  status: text('status', { enum: ['active', 'completed'] }).notNull(),
});

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
});

export const calories = sqliteTable('calories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  calories: integer('calories').notNull(),
});
