import { OverridedConfig } from '@flstk/config';
import { defaultConfig } from '@projects/expat/api/config/default';

export type Config = OverridedConfig<typeof defaultConfig>;
