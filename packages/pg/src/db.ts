import { GqlClient, GqlInvoke, SavepointCallback, SavepointScope } from '@flstk/pg-core';
import { enableExplain } from '@flstk/pg/explain';
import { GqlClientImpl } from '@flstk/pg/gql';
import { SqlClient, SqlClientImpl, SqlInvoke } from '@flstk/pg/sql';
import { GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { PostGraphileCoreOptions } from 'postgraphile-core';
import { watchPostGraphileSchema } from 'postgraphile/build/postgraphile';

export type ServerClient = GqlClient & SqlClient;
export type ServerSavepointScope = SavepointScope<ServerClient>;
export type Transaction = ServerSavepointScope;
export type ServerSavepointCallback<T> = SavepointCallback<ServerClient, T>;

export type ReadyQueryClient = ServerClient & {
    client: PoolClient;
};

export type ExplainConfig = {
    enabled: boolean;
    logger?: (message?: any, ...optionalParams: any[]) => any;
    gqlFormat?: (source: string) => string;
    sqlFormat?: (source: string) => string;
};

export type PgConfig = {
    schema?: string;
    explain?: ExplainConfig | boolean;
    postgraphile?: {
        options?: PostGraphileCoreOptions;
        onSchema?: (schema: GraphQLSchema) => void;
    };
};

export class Pg implements ServerSavepointScope {
    private pool: Pool;
    private schema!: GraphQLSchema;
    private initPromise?: Promise<Pg>;
    private isPoolExternal: boolean;
    private releaseSchema?: () => Promise<void>;

    public constructor(pool: Pool | string, private config: PgConfig) {
        this.pool = typeof pool === 'string' ? new Pool({ connectionString: pool }) : pool;
        this.isPoolExternal = typeof pool !== 'string';

        if (config.explain) {
            enableExplain(typeof config.explain === 'boolean' ? undefined : config.explain);
        }
    }

    private get schemaName() {
        return this.config.schema ?? 'public';
    }

    public getSchema = async () => this.init().then(() => this.schema);
    public client = () => this.pool.connect();

    public init = () => {
        if (!this.initPromise) {
            this.initPromise = this.initImpl();
        }

        return this.initPromise;
    };

    public close = async () => {
        if (this.isPoolExternal) {
            throw new Error('Pool was created outside of this instance, call pool.end() explicitly');
        }

        await this.releaseSchema?.();
        await this.pool.end();
    };

    private initImpl = async () => {
        this.releaseSchema = await watchPostGraphileSchema(
            this.pool,
            this.schemaName,
            this.config.postgraphile?.options,
            (schema) => {
                this.config.postgraphile?.onSchema?.(schema);
                this.schema = schema;
            },
        );

        return this;
    };

    public transaction = async <T>(fn: ServerSavepointCallback<T>): Promise<T> => {
        await this.init();

        const client = await this.pool.connect();
        try {
            const queryClient: ReadyQueryClient = {
                client,
                sql: new SqlClientImpl(client).sql,
                gql: new GqlClientImpl(client, this.schema, this.config).gql,
            };

            await client.query('BEGIN');
            const res = await fn(new SavepointScopeImpl(queryClient, 1));
            await client.query('COMMIT');
            return res;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            // should we call client.release(true) to destroy client or just release it to pool?
            client.release();
        }
    };

    /**
     * Alias for transaction
     */
    public savepoint = async <T>(fn: ServerSavepointCallback<T>): Promise<T> => {
        return this.transaction(fn);
    };

    public sql: SqlInvoke = (strings, ...chunks) => {
        return this.transaction((t) => t.sql(strings, ...chunks));
    };

    public gql: GqlInvoke = (query, variables) => {
        return this.transaction((t) => t.gql(query, variables));
    };
}

class SavepointScopeImpl implements ServerSavepointScope {
    public readonly gql;
    public readonly sql;

    public constructor(public readonly client: ReadyQueryClient, public readonly level: number) {
        this.sql = client.sql;
        this.gql = client.gql;
    }

    public savepoint = async <R>(fn: ServerSavepointCallback<R>): Promise<R> => {
        await this.client.client.query(`SAVEPOINT sp_${this.level}`);
        try {
            return await fn(new SavepointScopeImpl(this.client, this.level + 1));
        } catch (error) {
            await this.client.client.query(`ROLLBACK TO SAVEPOINT sp_${this.level}`);
            throw error;
        }
    };
}
