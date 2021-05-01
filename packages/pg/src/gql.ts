import { GqlClient, GqlError } from '@flstk/pg-core';
import { PgConfig } from '@flstk/pg/db';
import { graphql, GraphQLSchema } from 'graphql';
import { PoolClient } from 'pg';
import util from 'util';

export class GqlClientImpl implements GqlClient {
    private logger;
    private format: (s: string) => string;

    constructor(private pgClient: PoolClient, private schema: GraphQLSchema, private config: PgConfig) {
        this.logger = config.explain?.logger ?? console.log;
        this.format = config.explain?.gqlFormat ?? ((s: string) => s);
    }

    public gql = async <T = any>(query: string, variables?: Record<string, any>) => {
        if (this.config.explain?.enabled) {
            this.logger('Gql query:');
            this.logger(this.format(query));
            this.logger('Gql variables:');
            this.logger(util.inspect(variables, { showHidden: false, depth: null, colors: true }));
            this.logger();
        }

        const x = await graphql(this.schema, query, null, { pgClient: this.pgClient }, variables);
        if (x.errors?.length) {
            this.logger(JSON.stringify(x.errors));
            throw new GqlError(x.errors);
        }

        return x.data as T;
    };
}
