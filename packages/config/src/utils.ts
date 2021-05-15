export type OverridedConfig<T> = {
    readonly [P in keyof T]: T[P] extends ConfigOverrider<infer V>
        ? V
        : T[P] extends Record<string, unknown>
        ? OverridedConfig<T[P]>
        : T[P];
};

export type ConfigOverrider<T> = (value: string) => T;

export type ConfigOverride<T> = {
    [P in keyof T]?: T[P] extends ConfigOverrider<infer V> ? V : ConfigOverride<T[P]>;
};

export const declare = {
    number: (defaultValue: number) => {
        return (override: string | undefined) => {
            if (override) {
                const overrideValue = Number(override);
                if (!isNaN(overrideValue)) {
                    return overrideValue;
                }
            }

            return defaultValue;
        };
    },

    string: <T = string>(defaultValue: T): ConfigOverrider<T> => {
        return (override: string | undefined) => {
            if (override !== undefined) {
                return override as unknown as T;
            }

            return defaultValue as unknown as T;
        };
    },

    stringOrBoolean: <T extends string>(defaultValue: T | boolean): ConfigOverrider<T | boolean> => {
        return (override: string | undefined) => {
            if (override !== undefined) {
                if (override === 'true') {
                    return true;
                } else if (override === 'false') {
                    return false;
                }

                return override as unknown as T;
            }

            return defaultValue as unknown as T;
        };
    },

    boolean: (defaultValue: boolean): ConfigOverrider<boolean> => {
        return (override: string | undefined) => {
            if (override === 'true') {
                return true;
            } else if (override === 'false') {
                return false;
            }

            return defaultValue;
        };
    },
};
