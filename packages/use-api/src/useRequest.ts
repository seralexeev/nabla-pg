import { AsyncResult, ifSuccess } from '@flstk/result';
import { useAxiosInstance } from '@flstk/use-api/AxiosProvider';
import Axios, { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react';

export type RequestOptions = {
    cancelPrev?: boolean;
    cancelOnUnmount?: boolean;
    cancelRef?: MutableRefObject<CancelTokenSource | undefined>;
};

const defaultOptions = {
    cancelPrev: true,
    cancelOnUnmount: true,
};

export type AxiosRequest = {
    <T>(config: AxiosRequestConfig): AsyncResult<T>;
    post: <T>(url: string, data?: any, config?: Omit<AxiosRequestConfig, 'data'>) => AsyncResult<T>;
    get: <T>(url: string, config?: AxiosRequestConfig) => AsyncResult<T>;
};

export const useRequest = (axios: AxiosInstance, options: RequestOptions = {}): AxiosRequest => {
    const ref = useRef<CancelTokenSource>();
    const cancelRef = options.cancelRef ?? ref;
    const { cancelPrev, cancelOnUnmount } = Object.assign({}, defaultOptions, options);

    useEffect(() => {
        if (cancelOnUnmount) {
            return cancelRef.current?.cancel;
        }

        return undefined;
    }, [cancelOnUnmount, cancelRef]);

    return useMemo(() => {
        const request = <T>(request: AxiosRequestConfig) => {
            if (cancelPrev) {
                cancelRef.current?.cancel();
            }

            const axiosCancelSource = Axios.CancelToken.source();
            cancelRef.current = axiosCancelSource;
            return axios
                .request({ ...request, cancelToken: axiosCancelSource.token })
                .then(ifSuccess((x: any) => x.data as T));
        };

        request.get = <T>(url: string, config?: AxiosRequestConfig) => {
            return request<T>({ method: 'GET', url, ...config });
        };

        request.post = <T>(url: string, data?: any, config?: Omit<AxiosRequestConfig, 'data'>) => {
            return request<T>({ method: 'POST', url, data, ...config });
        };

        return request;
    }, [axios, cancelPrev, cancelRef]);
};

export const useApiRequest = (options?: RequestOptions) => useRequest(useAxiosInstance(true), options);

export const useCancelRequest = () => {
    const cancelRef = useRef<CancelTokenSource>();
    const cancel = useCallback(() => cancelRef.current?.cancel(), []);
    return [cancelRef, cancel] as const;
};
