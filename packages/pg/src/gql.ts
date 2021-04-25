import type { PgConfig } from '@flstk/pg/db';
import { graphql, GraphQLError, GraphQLSchema } from 'graphql';
import { PoolClient } from 'pg';
import util from 'util';

export const createGqlClient = (pgClient: PoolClient, schema: GraphQLSchema, config: PgConfig) => {
    const logger = config.explain?.logger ?? console.log;
    const format = config.explain?.gqlFormat ?? ((s: string) => s);

    return <T = any>(query: string, variables?: Record<string, any>) => {
        if (config.explain?.enabled) {
            logger('Gql query:');
            logger(format(query));
            logger('Gql variables:');
            logger(util.inspect(variables, { showHidden: false, depth: null, colors: true }));
            logger();
        }

        return graphql(schema, query, null, { pgClient }, variables).then((x) => {
            if (x.errors?.length) {
                logger(JSON.stringify(x.errors));
                throw new GqlError('Gql error occurred', x.errors);
            }

            return x.data as T;
        });
    };
};

export class GqlError extends Error {
    constructor(message: string, public errors: readonly GraphQLError[]) {
        super(message);
    }
}
