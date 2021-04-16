import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many';
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import { GraphQLScalarType, GraphQLSchema } from 'graphql';
import { Pool, PoolClient } from 'pg';
import { PostGraphileCoreOptions } from 'postgraphile-core';
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter';
import { watchPostGraphileSchema } from 'postgraphile/build/postgraphile';
import { createGqlClient } from './gql';
import { GqlInvoke } from './query';
import { createSqlClient, SqlInvoke } from './sql';

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
    private init?: Promise<any>;

    private get schemaName() {
        return this.config.schema ?? 'public';
    }

    public constructor(public readonly pool: Pool, private config: PgConfig = {}) {}

    public ensureInit = async () => {
        if (!this.init) {
            this.init = this.initImpl();
        }

        await this.init;
        return this;
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
    };

    public transaction = async <T>(fn: (arg: Transaction) => Promise<T>, config: { readonly?: boolean } = {}) => {
        await this.ensureInit();

        const schema = config?.readonly ? this.readonlySchema : this.schema;
        const client = await this.pool.connect();
        await client.query('BEGIN');
        try {
            const res = await fn({
                gql: createGqlClient(client, schema, this.config),
                sql: createSqlClient(client),
                client,
                isTransaction: true,
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

    private createPostgraphileOptions = () => {
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
