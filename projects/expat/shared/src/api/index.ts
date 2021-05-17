import { createApiClient } from '@flstk/use-api';
import { SplitString } from '@flstk/utils';

type ApiDef<T> = {
    [K in keyof T]: SplitString<K>[0] extends 'GET' | 'POST' ? T[K] : never;
};

type MigrationApi = ApiDef<{
    'GET /migrations': () => Array<{ name: string; migratedAt: string | Date }>;
}>;

const api = createApiClient<MigrationApi>({
    'GET /migrations': ({ get }) => {
        return () => get('/migrations');
    },
});

const [data] = api((x) => x['GET /migrations']).fetch();
