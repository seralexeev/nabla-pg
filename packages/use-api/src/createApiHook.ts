import { AsyncResult } from '@flstk/result';
import {
    AxiosRequest,
    FetchResult,
    RequestOptions,
    useAxiosInstance,
    useFetch,
    UseFetchOptions,
    useRequest
} from '@flstk/use-api';
import { useCallback } from 'react';

type Caller<R, P extends any[]> = (
    request: AxiosRequest,
) => P extends undefined ? () => () => AsyncResult<R> : (...args: P) => AsyncResult<R>;

export const createApiHook = <T extends Record<string, (request: AxiosRequest) => (...args: any) => any>>(t: T) => {
    return <R, P extends any[], E, S = R>(selector: (t: T) => Caller<R, P>, options: RequestOptions = {}) => {
        const axios = useAxiosInstance(true);
        const request = useRequest(axios, options);
        const caller = selector(t);

        type CallerArgs = Parameters<ReturnType<Caller<R, P>>>;
        type Result = ReturnType<Caller<R, P>> & {
            fetch: CallerArgs extends []
                ? (options?: UseFetchOptions<R, S>) => FetchResult<R, E, S>
                : (options: { args: CallerArgs } & UseFetchOptions<R, S>) => FetchResult<R, E, S>;
        };

        const result = useCallback((...p: any[]) => caller(request)(...p), [request]) as Result;
        result.fetch = ((options: any) => useFetch(result, options)) as any;

        return result;
    };
};

export type ApiClient<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => infer R
        ? (request: AxiosRequest) => P extends undefined ? () => () => AsyncResult<R> : (...args: P) => AsyncResult<R>
        : never;
};

export const createApiClient = <T>(map: ApiClient<T>) => createApiHook(map);
