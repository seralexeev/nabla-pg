import { AsyncResult } from '@flstk/result';
import { PromiseValue } from '@flstk/utils';
import { useAxiosInstance } from '@flstk/use-api/AxiosProvider';
import { FetchResult, useFetch, UseFetchOptions } from '@flstk/use-api/useFetch';
import { AxiosRequest, RequestOptions, useRequest } from '@flstk/use-api/useRequest';
import { useCallback } from 'react';

type Caller<R, P extends any[], E> = (
    request: AxiosRequest,
) => P extends undefined ? () => () => AsyncResult<R, E> : (...args: P) => AsyncResult<R, E>;

export const createApiHook = <T extends Record<string, (request: AxiosRequest) => (...args: any) => any>>(t: T) => {
    return <K extends keyof T>(selector: K, options: RequestOptions = {}) => {
        const axios = useAxiosInstance(true);
        const request = useRequest(axios, options);
        const caller = t[selector];

        type Type = T[K] extends Caller<infer R, infer P, infer E> ? [R, P, E] : never;
        type R = PromiseValue<Type[0]>;
        type P = Type[1];
        type E = Type[2];
        type S = R;

        type CallerArgs = Parameters<ReturnType<Caller<R, P, E>>>;
        type Result = ReturnType<Caller<R, P, E>> & {
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
