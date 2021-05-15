import { declare, OverridedConfig } from '@flstk/config';

export const defaultConfig = {
    port: declare.number(3000),
};

export type Config = OverridedConfig<typeof defaultConfig>;
