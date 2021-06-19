import { ConfigOverride, OverridedConfig } from '@flstk/config/utils';
import { flatten, unflatten } from 'flat';

export class ConfigLoader<TEnv extends string, TConfig> {
    private override;

    public constructor(
        public readonly prefix: string,
        public readonly appEnvironments: readonly TEnv[],
        private defaultConfig: TConfig,
        private envConfigs: Record<TEnv, ConfigOverride<TConfig>>,
        ...override: Array<ConfigOverride<TConfig>>
    ) {
        this.override = override;
    }

    public load = (env?: TEnv) => {
        const envVariables = process.env;
        if (!env) {
            const envCandidate = envVariables[`${this.prefix}_env`] as TEnv;
            if (!this.appEnvironments.includes(envCandidate)) {
                throw new Error(
                    `${this.prefix}_env should be one of [${this.appEnvironments.join(', ')}], got "${String(envCandidate)}"`,
                );
            }

            env = envCandidate;
        }

        const envOverride = this.envConfigs?.[env] ?? {};
        const flatConfig = flatten<TConfig, Record<string, (override: string | undefined) => unknown>>(this.defaultConfig, {
            delimiter: '_',
        });

        const flatEnvOverride = flatten<ConfigOverride<TConfig>, Record<string, unknown>>(envOverride, {
            delimiter: '_',
        });

        const flatOverride: Record<string, unknown> = this.override.reduce((acc, item) => {
            return Object.assign(acc, flatten<ConfigOverride<TConfig>, Record<string, unknown>>(item, { delimiter: '_' }));
        }, {});

        const traces: Record<string, string> = {};
        const overridedFlatConfig = Object.entries(flatConfig).reduce((acc, [key, valueFnOrValue]) => {
            const parseEnv = (val: string | undefined) => (typeof valueFnOrValue === 'function' ? valueFnOrValue(val) : val);

            // loads from 4 sources in priority order:
            // arg - from arguments
            // env - from environment variables or .env file
            // sta - static config, corresponding to selected environment
            // def - default config default.ts
            // err - error while loading
            const values: Array<['arg' | 'env' | 'sta' | 'def' | 'err', unknown]> = [
                ['arg', flatOverride[key]],
                [
                    'env',
                    envVariables[`${this.prefix}_` + key] !== undefined
                        ? parseEnv(envVariables[`${this.prefix}_` + key])
                        : undefined,
                ],
                ['sta', flatEnvOverride[key]],
                ['def', typeof valueFnOrValue === 'function' ? valueFnOrValue(undefined) : valueFnOrValue],
            ];
            const [from, value] = values.find(([, x]) => x !== undefined) || ['err', undefined];
            acc[key] = value;
            traces[key] = `[${from}] -> ${value} (${typeof value}) trace: [${values.map(([, x]) => String(x)).join(' -> ')}]`;
            return acc;
        }, {} as Record<string, unknown>);

        const overridedConfig = unflatten<typeof overridedFlatConfig, OverridedConfig<TConfig>>(overridedFlatConfig, {
            delimiter: '_',
        });

        Object.assign(overridedConfig, { env });

        return new ConfigWrapper(overridedConfig as OverridedConfig<TConfig> & { env: TEnv }, traces);
    };
}

export class ConfigWrapper<T> {
    public constructor(public readonly config: T, public traces: Record<string, string>) {}

    public debug = () => {
        return JSON.stringify(unflatten(this.traces, { delimiter: '_' }), null, 2);
    };
}
