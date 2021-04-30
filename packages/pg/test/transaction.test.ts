import { createDefaultPg } from '@flstk/pg/factory';
import { describe, expect, it } from '@jest/globals';

describe('transactions', () => {
    it('should create transaction', async () => {
        const pg = createDefaultPg('postgres://flstk:flstk@localhost:5432/flstk');
        type Row = { a: number };

        try {
            await pg.transaction(async (t) => {
                await t.sql`CREATE TABLE test1(a int)`;
                await t.sql`INSERT INTO test1(a) VALUES (1)`;
                await t.sql<Row>`SELECT * FROM test1`.then(({ rowCount }) => expect(rowCount).toEqual(1));

                try {
                    const a = await t.savepoint(async (s) => {
                        await s.sql`INSERT INTO test1(a) VALUES (1)`;
                        await s.sql<Row>`SELECT * FROM test1`.then(({ rowCount }) => expect(rowCount).toEqual(2));
                        throw new Error();
                    });
                } catch {
                    await t.sql<Row>`SELECT * FROM test1`.then(({ rowCount }) => expect(rowCount).toEqual(1));
                }

                throw new Error();
            });
        } catch {}

        await pg.close();
    });
});
