import { SplitString } from '@flstk/utils';

export type ApiDefinition<T> = {
    [K in keyof T]: SplitString<K>[0] extends 'GET' | 'POST' ? (T[K] extends (a: 1) => any ? T[K] : never) : never;
};
