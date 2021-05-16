import { createApiClient } from '@flstk/use-api';

type ApiDef<T> = {
    [K in keyof T]: Split<K>[0] extends 'GET' | 'POST' ? T[K] : never;
};

type Split<S> = S extends `${infer TLeft} ${infer TRight}` ? [TLeft, TRight] : never;

type MigrationApi = ApiDef<{
    'GET /migrations': () => Array<{ name: string; migratedAt: string | Date }>;
}>;

const api = createApiClient<MigrationApi>({
    'GET /migrations': ({ get }) => {
        return () => get('/migrations');
    },
});

const [data] = api((x) => x['GET /migrations']).fetch();
