import { FilterKeys } from '@flstk/utils/types';
export declare const pick: <T, K extends keyof T>(value: T, keys: readonly K[]) => Pick<T, K>;
export declare const reduceBy: <T, R = T>(arr: T[], keySelector: FilterKeys<T, string | number> | ((t: T, index: number) => string), map?: (t: T, index: number) => R) => Record<string, R>;
