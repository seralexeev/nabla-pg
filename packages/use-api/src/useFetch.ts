import { AsyncResult, isError, ResultError } from '@flstk/result';
import hash from 'object-hash';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export type FetchResultExtra<R, E = unknown, S = R> = {
    loading: boolean;
    error: ResultError<E> | null;
    refetch: () => AsyncResult<R, E>;
    refetching: boolean;
    setData: Dispatch<SetStateAction<S | undefined>>;
    version: number;
};

export type FetchResult<R, E, S = R> = [S | undefined, FetchResultExtra<R, E, S>];

export type UseFetchOptions<R, S = R> = {
    skip?: boolean;
    refreshVersion?: number;
    onData?: (prev: S | undefined, data: R) => S;
};

export function useFetch<R, E, S = R>(
    caller: () => AsyncResult<R, E>,
    options?: UseFetchOptions<R, S>,
): FetchResult<R, E, S>;
export function useFetch<P extends any[], R, E, S = R>(
    caller: (...args: P) => AsyncResult<R, E>,
    options: { args: P } & UseFetchOptions<R, S>,
): FetchResult<R, E, S>;
export function useFetch<P extends any[], R, E, S = R>(
    caller: (...args: P) => AsyncResult<R, E>,
    options?: any,
): FetchResult<R, E, S> {
    const { args = [], skip = false, refreshVersion = 0, onData } = options || {};

    const [data, setData] = useState<S | undefined>(undefined);
    const [error, setError] = useState<ResultError<E> | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [refetching, setRefetching] = useState(false);
    const count = useRef(0);
    const [version, setVersion] = useState(0);

    const refetch = useCallback(
        () => {
            setRefetching(true);

            if (count.current === 0) {
                setLoading(true);
            }

            const version = ++count.current;

            return caller(...args)
                .then((res) => {
                    if (isError(res)) {
                        setError(res);
                    } else {
                        setData((prev) => (onData ? onData(prev, res) : res));
                        setVersion((x) => x + 1);
                        setError(null);
                    }
                    return res;
                })
                .finally(() => {
                    if (version === 1) {
                        setLoading(false);
                    }

                    if (count.current === version) {
                        setRefetching(false);
                    }
                });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [hash(args ?? ''), caller],
    );

    useEffect(() => {
        if (!skip) {
            void refetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, skip, refreshVersion]);

    return [data, { loading, error, refetch, refetching, setData, version }];
}
