import { config } from 'dotenv';

config({ path: '.env.local' });

async function seed() {
    const { db } = await import('../lib/db/client');
    const { users } = await import('../lib/db/schema');
    const { hashPassword } = await import('../lib/auth/password');

    const accounts = [
        { username: 'marco', password: 'marco123', displayName: 'Marco', color: '#fabc00' },
        { username: 'jose', password: 'jose123', displayName: 'Jose', color: '#1b2cc1' },
    ];

    for (const account of accounts) {
        const passwordHash = await hashPassword(account.password);
        await db.insert(users).values({
            id: crypto.randomUUID(),
            username: account.username,
            passwordHash,
            displayName: account.displayName,
            color: account.color,
        });
        console.log(`Seeded user: ${account.username}`);
    }
}

seed()
    .then(() => {
        console.log('Seed complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
