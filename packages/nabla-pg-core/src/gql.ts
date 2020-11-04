import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many';
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import { graphql, GraphQLScalarType, GraphQLSchema } from 'graphql';
import { PoolClient } from 'pg';
import { createPostGraphileSchema } from 'postgraphile';
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter';
import { GqlError } from './errors';

export const createSchema = async (connectionString: string) => {
    const schema = await createPostGraphileSchema(connectionString, ['public'], {
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

    // TODO: fix this workaround
    const dateType = schema.getType('Datetime') as GraphQLScalarType;
    if (dateType) {
        dateType.parseValue = (val: unknown) => (val instanceof Date ? val.toISOString() : val);
        dateType.serialize = (val: unknown) => (typeof val === 'string' ? new Date(val) : val);
    }

    return schema;
};

export type GqlInvoke = ReturnType<typeof createGqlClient>;
export const createGqlClient = (pgClient: PoolClient, schema: GraphQLSchema) => {
    return <T = any>(query: string, variables?: Record<string, any>) => {
        return graphql(schema, query, null, { pgClient }, variables).then((x) => {
            if (x.errors?.length) {
                console.log(x.errors);
                throw new GqlError('Gql error occurred', x.errors);
            }

            return x.data as T;
        });
    };
};
