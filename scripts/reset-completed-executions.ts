import { config } from 'dotenv';

config({ path: '.env.local' });

async function run() {
    const { db } = await import('../lib/db/client');
    const { executions, exerciseExecutions } = await import('../lib/db/schema');
    const { eq, inArray } = await import('drizzle-orm');

    const completed = await db.select({ id: executions.id }).from(executions).where(eq(executions.status, 'completed'));
    const ids = completed.map((e) => e.id);
    console.log(`Deleting ${ids.length} completed executions (and their exercise rows). Active sessions are left untouched.`);

    if (ids.length) {
        await db.delete(exerciseExecutions).where(inArray(exerciseExecutions.executionId, ids));
        await db.delete(executions).where(inArray(executions.id, ids));
    }
    console.log('Done.');
}

run().then(() => process.exit(0));
