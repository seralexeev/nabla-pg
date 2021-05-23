import { declare, OverridedConfig } from '@flstk/config';
import { bootstrapperConfig } from '@flstk/rest';
import { merge } from 'lodash';

export const defaultConfig = merge(bootstrapperConfig, {
    pg: {
        user: declare.string('expat'),
        password: declare.string('expat'),
        database: declare.string('expat'),
    },
});

export type Config = OverridedConfig<typeof defaultConfig>;
