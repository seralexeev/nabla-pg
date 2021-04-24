import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many';
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import { createGqlClient } from '@nabla/pg/gql';
import { GqlInvoke } from '@nabla/pg/query';
import { createSqlClient, SqlInvoke } from '@nabla/pg/sql';
import { GraphQLScalarType, GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { PostGraphileCoreOptions } from 'postgraphile-core';
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter';
import { watchPostGraphileSchema } from 'postgraphile/build/postgraphile';

export type QueryClient = { gql: GqlInvoke; sql: SqlInvoke; client: PoolClient };
export type Transaction = QueryClient & {
    isTransaction: true;
};

export type PgConfig = {
    schema?: string;
    explain?: {
        enabled: boolean;
        logger?: (message?: any, ...optionalParams: any[]) => any;
        format?: (source: string) => string;
    };
    postgraphile?: PostGraphileCoreOptions;
};

export class Pg {
    private schema!: GraphQLSchema;
    private readonlySchema!: GraphQLSchema;
    private initPromise?: Promise<Pg>;

    public constructor(public readonly pool: Pool, private config: PgConfig = {}) {}

    private get schemaName() {
        return this.config.schema ?? 'public';
    }

    public init = () => {
        if (!this.initPromise) {
            this.initPromise = this.initImpl();
        }

        return this.initPromise;
    };

    private initImpl = async () => {
        const postgraphileOptions = this.createPostgraphileOptions();

        await Promise.all([
            watchPostGraphileSchema(this.pool, this.schemaName, postgraphileOptions, (schema) => {
                this.schema = this.applyTypeWorkarounds(schema);
            }),
            watchPostGraphileSchema(
                this.pool,
                this.schemaName,
                { ...postgraphileOptions, disableDefaultMutations: true },
                (schema) => {
                    this.readonlySchema = this.applyTypeWorkarounds(schema);
                },
            ),
        ]);

        return this;
    };

    public transaction = async <T>(fn: (t: Transaction) => Promise<T>, config: { readonly?: boolean } = {}) => {
        await this.init();

        const schema = config?.readonly ? this.readonlySchema : this.schema;
        const client = await this.pool.connect();
        await client.query('BEGIN');
        try {
            const res = await fn({
                gql: createGqlClient(client, schema, this.config),
                sql: createSqlClient(client),
                isTransaction: true,
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

    public readonlyGql: GqlInvoke = (query, variables) => {
        return this.transaction((t) => t.gql(query, variables), { readonly: true });
    };

    private applyTypeWorkarounds = (schema: GraphQLSchema) => {
        const dateType = schema.getType('Datetime') as GraphQLScalarType;
        if (dateType) {
            dateType.parseValue = (val: unknown) => {
                if (val instanceof Date) {
                    return val.toISOString();
                }

                return val;
            };
            dateType.serialize = (val: unknown) => {
                if (typeof val === 'string') {
                    return new Date(val);
                }

                return val;
            };
        }

        return schema;
    };

    protected createPostgraphileOptions = () => {
        return {
            appendPlugins: [
                ...(this.config.postgraphile?.appendPlugins ?? []),
                ConnectionFilterPlugin,
                PgManyToManyPlugin,
                PgSimplifyInflectorPlugin,
            ],
            graphileBuildOptions: {
                connectionFilterRelations: true,
                pgOmitListSuffix: true,
                pgSimplifyPatch: true,
                pgSimplifyAllRows: true,
                pgShortPk: true,
                ...this.config.postgraphile?.graphileBuildOptions,
            },
            dynamicJson: true,
            enableQueryBatching: true,
            simpleCollections: 'both' as const,
            legacyRelations: 'omit' as const,
            ...this.config.postgraphile,
        };
    };
}
