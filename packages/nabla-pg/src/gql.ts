import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many';
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import { graphql, GraphQLError, GraphQLSchema } from 'graphql';
import { PoolClient } from 'pg';
import { createPostGraphileSchema } from 'postgraphile';
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter';

export const createSchema = (connectionString: string) => {
    return createPostGraphileSchema(connectionString, ['public'], {
        appendPlugins: [ConnectionFilterPlugin, PgManyToManyPlugin, PgSimplifyInflectorPlugin],
        graphileBuildOptions: {
            connectionFilterRelations: true,
            pgOmitListSuffix: true,
            pgSimplifyPatch: true,
            pgSimplifyAllRows: true,
            pgShortPk: true,
        },
        dynamicJson: true,
        simpleCollections: 'both' as const,
        legacyRelations: 'omit' as const,
    });
};

export type GqlInvoke = ReturnType<typeof createGqlClient>;
export const createGqlClient = (pgClient: PoolClient, schema: GraphQLSchema) => {
    return <T = any>(strings: TemplateStringsArray, ...values: unknown[]) => (params: {
        variables?: Record<string, any>;
    }) => {
        const { variables } = params;
        const query = typeof strings === 'string' ? strings : String.raw(strings, ...values);
        return graphql<T>(schema, query, null, { pgClient }, variables).then((x) => {
            if (x.errors) {
                console.log(x.errors);
                throw new GqlError('Gql error', x.errors);
            }

            return x.data as T;
        });
    };
};

class GqlError extends Error {
    constructor(message: string, public errors: readonly GraphQLError[]) {
        super(message);
    }
}
