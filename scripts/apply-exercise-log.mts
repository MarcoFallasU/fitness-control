/**
 * Adds the exercise_log table and the missing indexes, then fills the log from
 * the finished sessions that already exist.
 *
 * Additive and idempotent: it only uses CREATE ... IF NOT EXISTS and never
 * touches existing rows, so it is safe to run more than once.
 *
 *   pnpm tsx scripts/apply-exercise-log.mts
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

const { db } = await import('../lib/db/client');
const { rebuildExerciseLog } = await import('../services/exercisesService');
const { sql } = await import('drizzle-orm');

const statements = [
    `CREATE TABLE IF NOT EXISTS exercise_log (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        execution_id text NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
        date text NOT NULL,
        exercise_name text NOT NULL,
        muscle_group text NOT NULL,
        sets integer NOT NULL,
        reps integer NOT NULL,
        weight real NOT NULL,
        volume integer NOT NULL,
        position integer NOT NULL DEFAULT 0
    )`,
    'CREATE INDEX IF NOT EXISTS exercise_log_user_date_idx ON exercise_log (user_id, date)',
    'CREATE INDEX IF NOT EXISTS exercise_log_execution_idx ON exercise_log (execution_id)',
    'CREATE INDEX IF NOT EXISTS measurements_user_idx ON measurements (user_id)',
    'CREATE INDEX IF NOT EXISTS routine_groups_user_idx ON routine_groups (user_id)',
    'CREATE INDEX IF NOT EXISTS routines_user_idx ON routines (user_id)',
    'CREATE INDEX IF NOT EXISTS exercises_routine_idx ON exercises (routine_id)',
    'CREATE INDEX IF NOT EXISTS executions_user_status_idx ON executions (user_id, status)',
    'CREATE INDEX IF NOT EXISTS exercise_executions_execution_idx ON exercise_executions (execution_id)',
    'CREATE INDEX IF NOT EXISTS calories_user_date_idx ON calories (user_id, date)',
];

for (const statement of statements)
    await db.run(sql.raw(statement));
console.log(`schema ok (${statements.length} statements)`);

const before = await db.all<{ n: number }>(sql.raw('SELECT count(*) AS n FROM exercise_log'));
const executionsDone = await rebuildExerciseLog();
const after = await db.all<{ n: number }>(sql.raw('SELECT count(*) AS n FROM exercise_log'));
console.log(`finished sessions processed: ${executionsDone}`);
console.log(`log rows: ${before[0].n} -> ${after[0].n}`);
process.exit(0);
