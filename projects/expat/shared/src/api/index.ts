// import { ApiDefinition } from '@projects/expat/shared/api/utils';

// import { SplitString } from '@flstk/utils';

// export type UserApi = ApiDefinition<{
//     'GET /profile/:id': ApiOptions<{ id: string; name: string }>;
// }>;

// export type ApiDefinition<T> = {
//     [K in keyof T]: SplitString<K>[0] extends 'GET' | 'POST' ? (T[K] extends () => any ? T[K] : never) : never;
// };

// const createApi = <T>(t: ApiDefinition<T>) => {};

// useApi('GET /profile/:id');
