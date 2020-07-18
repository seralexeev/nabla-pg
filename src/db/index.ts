import { GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { GqlInvoke, createGqlClient } from './gql';
import { createSqlClient, SqlInvoke } from './sql';

export type Transaction = { gql: GqlInvoke; sql: SqlInvoke; client: PoolClient };
export type Pg = ReturnType<typeof createPg>;

export const createPg = (pool: Pool, schema: GraphQLSchema) => {
    const transaction = async <T>(fn: (arg: Transaction) => Promise<T>) => {
        const client = await pool.connect();
        await client.query('BEGIN');
        try {
            const res = await fn({
                gql: createGqlClient(client, schema),
                sql: createSqlClient(client),
                client,
            });

            await client.query('COMMIT');
            return res;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    };

    const sql: SqlInvoke = (strings, ...chunks) => {
        return transaction((t) => t.sql(strings, ...chunks));
    };

    const gql: GqlInvoke = (strings, ...chunks) => (params) => {
        return transaction((t) => t.gql(strings, ...chunks)(params));
    };

    return {
        sql,
        gql,
        transaction,
    };
};
