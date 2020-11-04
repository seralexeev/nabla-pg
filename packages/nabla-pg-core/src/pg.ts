import { GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { createGqlClient, GqlInvoke } from './gql';
import { createSqlClient, SqlInvoke } from './sql';

export type Transaction = { gql: GqlInvoke; sql: SqlInvoke; client: PoolClient };

export class Pg {
    public constructor(public readonly pool: Pool, private schema: GraphQLSchema) {}

    public transaction = async <T>(fn: (arg: Transaction) => Promise<T>) => {
        const client = await this.pool.connect();
        await client.query('BEGIN');
        try {
            const res = await fn({
                gql: createGqlClient(client, this.schema),
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

    public sql: SqlInvoke = (strings, ...chunks) => {
        return this.transaction((t) => t.sql(strings, ...chunks));
    };

    public gql: GqlInvoke = (query, variables) => {
        return this.transaction((t) => t.gql(query, variables));
    };
}
