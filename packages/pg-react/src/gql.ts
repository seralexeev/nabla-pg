import { GqlClient } from '@flstk/pg-core/gql';
import { SavepointCallback, SavepointScope } from '@flstk/pg-core/transaction';

export type ClientGqlClient = SavepointScope<GqlClient>;
export type ClientSavepointCallback<T> = SavepointCallback<ClientGqlClient, T>;
