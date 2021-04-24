import { FilterKeys } from '@nabla/utils/types';
import lodash from 'lodash';

export const pick = <T, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> => {
    return lodash.pick(value, keys) as Pick<T, K>;
};

export const reduceByKey = <T, R = T>(
    arr: T[],
    keySelector: ((t: T, index: number) => string) | FilterKeys<T, string | number>,
    map: (t: T, index: number) => R = (t) => t as any,
) => {
    const keySelectorFinally = lodash.isFunction(keySelector) ? keySelector : (t: any) => t[keySelector] as string;

    return arr.reduce((acc, item, index) => {
        acc[keySelectorFinally(item, index)] = map(item, index);
        return acc;
    }, {} as Record<string, R>);
};