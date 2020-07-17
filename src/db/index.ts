import { GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { GqlInvoke, makeGqlClientFactory } from './gql';
import { createSqlClient, SqlInvoke } from './sql';

export type Transaction = { gql: GqlInvoke; sql: SqlInvoke; client: PoolClient };
export type Pg = ReturnType<typeof createPg>;

export const createPg = (pool: Pool, schema: GraphQLSchema) => {
    const createGqlClient = makeGqlClientFactory(schema);

    const sql: SqlInvoke = (strings, ...chunks) => {
        return pool.connect().then(async (client) => {
            try {
                return createSqlClient(client)(strings, ...chunks);
            } finally {
                client.release();
            }
        });
    };

    const gql: GqlInvoke = (strings, ...chunks) => (params) => {
        return pool.connect().then((client) => {
            try {
                return createGqlClient(client)(strings, ...chunks)(params);
            } finally {
                client.release();
            }
        });
    };

    const transaction = async <T>(fn: (arg: Transaction) => Promise<T>) => {
        const client = await pool.connect();
        await client.query('BEGIN');
        try {
            const res = await fn({
                gql: createGqlClient(client),
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

    return {
        sql,
        gql,
        transaction,
    };
};
