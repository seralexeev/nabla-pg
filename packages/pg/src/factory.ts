import { PgConfig } from '@flstk/pg/db';
import { NonNullRelationsPlugin } from '@flstk/pg/plugins/NonNullRelationsPlugin';
import { PgNumericToBigJsPlugin } from '@flstk/pg/plugins/PgNumericToBigJsPlugin';
import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many';
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import Big from 'big.js';
import { GraphQLScalarType, GraphQLSchema } from 'graphql';
import { Pg } from 'packages/pg';
import { Pool, types } from 'pg';
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter';

export const createDefaultPg = (pool: Pool | string, config: PgConfig = {}) => {
    Big.prototype.toPostgres = function () {
        // TODO: proper serialization
        return this.toFixed(2);
    };

    types.setTypeParser(1700, (val) => new Big(val));

    const onSchema = (schema: GraphQLSchema) => {
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
    };

    const options = {
        appendPlugins: [
            ...(config.postgraphile?.options?.appendPlugins ?? []),
            NonNullRelationsPlugin,
            PgNumericToBigJsPlugin,
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
            ...config.postgraphile?.options?.graphileBuildOptions,
        },
        dynamicJson: true,
        enableQueryBatching: true,
        simpleCollections: 'both' as const,
        legacyRelations: 'omit' as const,
        ...config.postgraphile,
    };

    return new Pg(pool, {
        ...config,
        postgraphile: {
            onSchema,
            options,
        },
    });
};
