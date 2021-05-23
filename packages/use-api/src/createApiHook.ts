import { AsyncResult } from '@flstk/result';
import { useAxiosInstance } from '@flstk/use-api/AxiosProvider';
import { FetchResult, useFetch, UseFetchOptions } from '@flstk/use-api/useFetch';
import { AxiosRequest, RequestOptions, useRequest } from '@flstk/use-api/useRequest';
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

type ReturnType<T> = T extends (...args: any) => infer R ? R : any;

export type ApiClient<T, E> = {
    [K in keyof E]: K extends keyof T
        ? (request: AxiosRequest<T[K]>) => ReturnType<E[K]> extends (...args: infer P) => infer R ? (...args: P) => R : never
        : never;
};

export const createApiClient = <T>() => {
    return <E extends ApiClient<T, E>>(obj: E) => {
        return createApiHook(obj);
    };
};
