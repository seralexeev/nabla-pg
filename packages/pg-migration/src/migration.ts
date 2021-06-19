import { literal, Pg, Transaction } from '@flstk/pg';
import { promises as fs } from 'fs';
import { never } from '@flstk/utils';
import path from 'path';

export type RunMigrationsArgs = {
    directory: string;
    pg: Pg;
};

export type MigrationEntity = {
    name: string;
    migratedAt: Date;
};

type AdvisoryXactLockResult = {
    lockObtained: boolean;
};

const LOCK_ID = literal(27031991);

export const runMigrations = async (args: RunMigrationsArgs) => {
    const { pg } = args;

    await pg.transaction(async (t) => {
        const [{ lockObtained } = never<{ lockObtained: false }>()] =
            await t.sql<AdvisoryXactLockResult>`SELECT pg_try_advisory_xact_lock(${LOCK_ID}) AS "lockObtained"`;

        if (lockObtained) {
            await migrate({ t, directory: args.directory });
        } else {
            throw new Error(`"advisory_xact_lock" could not be obtained (${LOCK_ID}), another migration is ongoing`);
        }
    });
};

const log = console.log;

const migrate = async (args: { t: Transaction; directory: string }) => {
    const { t, directory } = args;
    await t.sql`CREATE TABLE IF NOT EXISTS migrations (
          name text PRIMARY KEY
        , migrated_at timestamptz
    )`;

    log(`Scanning directory ${directory} for migrations`);
    const files = await fs.readdir(directory).then((x) => {
        return x
            .map((file) => {
                const [dateStr = ''] = file.split('_');
                const date = parseInt(dateStr, 10);
                if (isNaN(date)) {
                    log(`${file} doesn't satisfy convention (<date>_<name>), skipping`);
                }

                return [file, date] as const;
            })
            .sort(([, a], [, b]) => a - b)
            .map(([file]) => file);
    });

    const migrations = await t.sql<MigrationEntity>`SELECT name FROM migrations ORDER BY migrated_at ASC`;
    const migrationSet = new Set(migrations.map((x) => x.name));
    const newCount = migrations.filter((x) => !migrationSet.has(x.name)).length;
    log(`Found ${files.length} migrations of which ${newCount} are new`);

    for (const name of files) {
        if (migrationSet.has(name)) {
            log(`[${name}]: has been applied already, skipping`);
            continue;
        }

        log(`[${name}]: starting`);
        const now = new Date().getTime();
        const fullPath = path.resolve(path.join(directory, name));
        const module = require(fullPath);
        if (!module?.default) {
            throw new Error(`Migration "${name}" (${fullPath}) is not a node module with default export`);
        }

        const fn = module.default;
        if (typeof fn !== 'function') {
            throw new Error(`Migration ${name} (${fullPath}) doesn't have a migration callback`);
        }

        await fn(t, (s: string) => log(`    ${s}`));

        const [{ migratedAt } = never<{ migratedAt: Date }>()] = await t.sql<{ migratedAt: Date }>`
            INSERT INTO migrations (name, migrated_at) VALUES (${name}, clock_timestamp()) RETURNING migrated_at AS "migratedAt"`;

        log(`[${name}]: success at ${migratedAt.toISOString()} (${new Date().getTime() - now}ms)`);
    }
};
