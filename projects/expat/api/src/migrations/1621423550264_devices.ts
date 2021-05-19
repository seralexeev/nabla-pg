import { Transaction } from '@flstk/pg';

export default async (t: Transaction) => {
    await t.sql`CREATE TABLE IF NOT EXISTS user_devices (
          id uuid NOT NULL PRIMARY KEY
        , user_id uuid NOT NULL REFERENCES users(id)
        , fcm_token text
        , push_authorization_status text
        , refresh_token text
        , device_info jsonb
        , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
        , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`;
};
