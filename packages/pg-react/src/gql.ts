import { GqlClient, SavepointCallback, SavepointScope } from '@flstk/pg-core';

export type ClientGqlClient = SavepointScope<GqlClient>;
export type ClientSavepointCallback<T> = SavepointCallback<ClientGqlClient, T>;
