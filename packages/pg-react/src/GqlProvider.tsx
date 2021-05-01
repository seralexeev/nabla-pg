import { GqlInvoke } from '@flstk/pg-core/gql';
import { SavepointCallback } from '@flstk/pg-core/transaction';
import { ClientGqlClient, ClientSavepointCallback } from '@flstk/pg-react/gql';
import { isError, ResultErrorWrapper } from '@flstk/result';
import { AxiosRequest, RequestOptions, useApiRequest } from '@flstk/use-api/useRequest';
import React, { createContext, FC, useContext, useMemo } from 'react';

type GqlClientProviderProp = {
    path: string;
};

const options: RequestOptions = { cancelPrev: false };
export const GqlClientProvider: FC<GqlClientProviderProp> = ({ path, children }) => {
    const request = useApiRequest(options);
    if (!request) {
        throw new Error(
            'Unable to receive AxiosInstance using react context. Ensure you place AxiosProvider close to the root of your app',
        );
    }
    const value = useMemo(() => new GqlClientImpl(path, request), [path, request]);

    return <Context.Provider value={value} children={children} />;
};

class GqlClientImpl implements ClientGqlClient {
    public constructor(private path: string, private request: AxiosRequest) {}

    public gql: GqlInvoke = async (query, variables) => {
        const res = await this.request.post<any>(this.path, { query, variables });
        if (isError(res)) {
            throw new ResultErrorWrapper(res);
        }

        return res.data;
    };

    public savepoint: <R>(fn: SavepointCallback<ClientGqlClient, R>) => Promise<R> = (fn) => {
        console.warn('Savepoints are not supported');
        return fn(new SavepointScopeImpl(this));
    };
}

class SavepointScopeImpl {
    public readonly gql;

    public constructor(public readonly client: ClientGqlClient) {
        this.gql = client.gql;
    }

    public savepoint = async <R,>(fn: ClientSavepointCallback<R>): Promise<R> => {
        return await fn(new SavepointScopeImpl(this.client));
    };
}

const Context = createContext<ClientGqlClient>(null!);
export const useGraphQLClient = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error(
            'Unable to receive GqlClient using react context. Ensure you place GqlClientProvider close to the root of your app',
        );
    }

    return context;
};
