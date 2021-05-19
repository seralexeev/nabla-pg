import { declare, OverridedConfig } from '@flstk/config';

export const bootstrapperConfig = {
    port: declare.number(3000),
    apiEndpoint: '/api',
    build: {
        vcsRef: declare.string('unknown'),
        date: declare.string('unknown'),
    },
    auth: {
        jwt: {
            secret: declare.string('jwt-secret-REPLACE-IT'),
            accessExpiresIn: declare.string('1d'),
            refreshExpiresIn: declare.string('30 days'),
            issuer: declare.string('api'),
        },
    },
    logging: {
        logResponses: declare.stringOrBoolean<'full'>(false),
        prettyPrint: declare.boolean(false),
    },
    pg: {
        port: declare.number(5432),
        host: declare.string('localhost'),
        user: declare.string(''),
        password: declare.string(''),
        database: declare.string(''),
        schema: declare.string('public'),
    },
    postgraphile: {
        endpoint: declare.string('/api/graphql'),
        graphiql: declare.boolean(true),
        disableQueryLog: declare.boolean(false),
        showErrorStack: declare.stringOrBoolean('json'),
        timezone: declare.string('Europe/Moscow'),
    },
    worker: {
        concurrency: declare.number(10),
        pollInterval: declare.number(1000),
    },
    development: {
        useThrottle: declare.boolean(false),
    },
};

export type BootstrapperConfig = OverridedConfig<typeof bootstrapperConfig>;
