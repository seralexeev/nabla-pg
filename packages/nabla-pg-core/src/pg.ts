import { GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { createGqlClient, GqlExplainOptions, GqlInvoke } from './gql';
import { createSqlClient, SqlInvoke } from './sql';

export type QueryClient = { gql: GqlInvoke; sql: SqlInvoke; client: PoolClient };
export type Transaction = QueryClient & {
    isTransaction: true;
};

export class Pg {
    public constructor(
        public readonly pool: Pool,
        private schema: GraphQLSchema,
        private options?: {
            explain?: GqlExplainOptions;
        },
    ) {}

    public transaction = async <T>(fn: (arg: QueryClient) => Promise<T>) => {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const res = await this.queryImpl(client, fn);
            await client.query('COMMIT');
            return res;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    };

    private queryImpl = <T>(client: PoolClient, fn: (arg: QueryClient) => Promise<T>) => {
        return fn({
            gql: createGqlClient(client, this.schema, this.options?.explain),
            sql: createSqlClient(client),
            client,
        });
    };

    public sql: SqlInvoke = async (strings, ...chunks) => {
        const client = await this.pool.connect();
        try {
            return await this.queryImpl(client, (t) => t.sql(strings, ...chunks));
        } finally {
            client.release();
        }
    };

    public gql: GqlInvoke = async (query, variables) => {
        const client = await this.pool.connect();
        try {
            return await this.queryImpl(client, (t) => t.gql(query, variables));
        } finally {
            client.release();
        }
    };
}
