import { generateEntityFiles, Pg } from '@flstk/pg';

export const generate = async () => {
    const pg = new Pg('postgres://flstk:flstk@localhost:5432/flstk');

    await pg.sql`DROP TABLE IF EXISTS orders`;
    await pg.sql`DROP TABLE IF EXISTS users`;
    await pg.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await pg.sql`CREATE TABLE IF NOT EXISTS users(
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
        , name text NOT NULL
    )`;

    await pg.sql`CREATE TABLE IF NOT EXISTS orders(
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
        , user_id uuid NOT NULL REFERENCES users(id)
        , comment text
    )`;

    generateEntityFiles(await pg.getSchema(), {
        prefix: 'Entity',
        entityImportPath: '.',
        entityDir: './entities',
    });
};
