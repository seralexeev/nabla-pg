import { declare, OverridedConfig } from '@flstk/config';

export const defaultConfig = {
    port: declare.number(3000),
    pg: {
        port: declare.number(5433),
        host: declare.string('localhost'),
        user: declare.string('expat'),
        password: declare.string('expat'),
        database: declare.string('expat'),
        debugExplain: declare.boolean(false),
    },
};

export type Config = OverridedConfig<typeof defaultConfig>;
