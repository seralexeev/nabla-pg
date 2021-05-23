import { Transaction } from '@flstk/pg';

export default async (t: Transaction) => {
    await t.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await t.sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
    await t.sql`CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = clock_timestamp();
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql`;

    await t.sql`CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
        , name text
        , email text
        , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
        , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`;

    await t.sql`CREATE TRIGGER set_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};
