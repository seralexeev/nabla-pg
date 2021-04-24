import { ifSuccess, isError, makeError, Result, ResultError } from '@flstk/result';
import { RequestOptions, useRequest } from '@flstk/use-api/useRequest';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import jwtDecode from 'jwt-decode';
import React, { createContext, FC, useCallback, useContext, useMemo, useRef, useState } from 'react';

type AuthContextValue = {
    accessToken: string | null;
    userId: string | null;
    setAccessToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => Promise<void>;
    renewTokens: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>(null!);
type AxiosContextType = {
    authenticated: AxiosInstance;
    axios: AxiosInstance;
};

const AxiosContext = createContext<AxiosContextType>(null!);

export const useAxiosInstance = (auth?: boolean) => {
    const { authenticated, axios } = useContext(AxiosContext);
    return auth ? authenticated : axios;
};
export const useAuth = () => useContext(AuthContext);
export const useApiRequest = (options?: RequestOptions) => useRequest(useAxiosInstance(true), options);

type AuthProps = {
    refreshTokenUrl: string;
    getRefreshToken?: () => Promise<string>;
    setRefreshToken?: (token: string | null) => Promise<void>;
};

export type AxiosProviderProps = {
    config?: AxiosRequestConfig;
    onError?: (error: ResultError) => void;
    postInitialize?: (axios: AxiosInstance) => void;
    auth?: AuthProps;
};

export const AxiosProvider: FC<AxiosProviderProps> = ({ children, config, onError, postInitialize, auth }) => {
    const createAxios = useCallback(() => {
        const instance = Axios.create(config);
        postInitialize?.(instance);
        return instance;
    }, [config, postInitialize]);

    const errorInterceptor = useCallback((e: any) => handleError(e, onError), [onError]);

    if (auth) {
        return (
            <AuthAxiosProvider
                auth={auth}
                createAxios={createAxios}
                errorInterceptor={errorInterceptor}
                children={children}
            />
        );
    } else {
        return (
            <SimpleAxiosProvider createAxios={createAxios} errorInterceptor={errorInterceptor} children={children} />
        );
    }
};

const SimpleAxiosProvider: FC<{
    createAxios: () => AxiosInstance;
    errorInterceptor: (e: any) => ResultError<unknown>;
}> = ({ createAxios, children, errorInterceptor }) => {
    const value: AxiosContextType = useMemo(() => {
        const axios = createAxios();
        axios.interceptors.response.use(undefined, errorInterceptor);
        return {
            axios,
            authenticated: axios,
        };
    }, [createAxios]);

    return <AxiosContext.Provider value={value} children={children} />;
};

const AuthAxiosProvider: FC<{
    createAxios: () => AxiosInstance;
    auth: AuthProps;
    errorInterceptor: (e: any) => ResultError<unknown>;
}> = ({ children, createAxios, errorInterceptor, auth }) => {
    const { refreshTokenUrl, getRefreshToken, setRefreshToken } = auth;
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const accessTokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);

    const setAccessToken = useCallback((token: string | null) => {
        accessTokenRef.current = token;
        setAccessTokenState(token);
    }, []);

    const setRefreshTokenImpl = useCallback(async (token: string | null) => {
        refreshTokenRef.current = token;
        void setRefreshToken?.(token);
    }, []);

    const [axiosInstance, renewTokens] = useMemo(() => {
        const accessTokenInterceptors = async (request: AxiosRequestConfig) => {
            if (accessTokenRef.current) {
                request.headers['Authorization'] = `Bearer ${accessTokenRef.current}`;
            }

            return request;
        };

        const authenticated = createAxios();
        authenticated.interceptors.request.use(accessTokenInterceptors);

        const axios = createAxios();
        axios.interceptors.response.use(undefined, errorInterceptor);

        const renewTokens = async (onSuccess?: (accessToken: string) => void) => {
            accessTokenRef.current = null;
            if (!refreshTokenRef.current && getRefreshToken) {
                refreshTokenRef.current = await getRefreshToken().catch(() => null);
            }

            const data = refreshTokenRef.current ? { refreshToken: refreshTokenRef.current } : undefined;
            const res = await axios
                .post<Result<{ accessToken: string; refreshToken?: string }>>(refreshTokenUrl, data)
                .then(ifSuccess((x) => x.data));
            if (isError(res)) {
                if (res.code === 'UNAUTHORIZED') {
                    setAccessToken(null);
                    await setRefreshTokenImpl(null);
                    throw new ErrorResultError(res);
                }
            } else if (res.accessToken) {
                setAccessToken(res.accessToken);
                if (res.refreshToken) {
                    await setRefreshTokenImpl(res.refreshToken);
                }

                onSuccess?.(res.accessToken);
            }
        };

        createAuthRefreshInterceptor(authenticated, async (failedRequest: any) => {
            return renewTokens(
                (accessToken) => (failedRequest.response.config.headers['Authorization'] = `Bearer ${accessToken}`),
            );
        });

        authenticated.interceptors.response.use(undefined, errorInterceptor);

        return [{ authenticated, axios }, renewTokens];
    }, [createAxios, setAccessToken, setRefreshTokenImpl, errorInterceptor]);

    const userId = useMemo(() => {
        return accessToken ? jwtDecode<{ sub: string }>(accessToken).sub : null;
    }, [accessToken]);

    const value = useMemo(
        () => ({ accessToken, userId, setAccessToken, setRefreshToken: setRefreshTokenImpl, renewTokens }),
        [accessToken, userId, setAccessToken, setRefreshTokenImpl, renewTokens],
    );

    return (
        <AxiosContext.Provider value={axiosInstance}>
            <AuthContext.Provider value={value} children={children} />
        </AxiosContext.Provider>
    );
};

const handleError = (error: any, onError?: (error: ResultError) => void) => {
    if (Axios.isCancel(error)) {
        return makeError('CANCELED', 'Request was canceled', { error });
    }

    let resError: ResultError;
    if (error.code === 'ECONNABORTED') {
        resError = makeError('TIMEOUT', 'Timeout error', { error });
    } else if (error.message === 'Network Error') {
        resError = makeError('NETWORK', 'Network error', { error });
    } else if (error.name === 'ErrorResultError') {
        resError = error.result;
    } else {
        const message = error.message ?? error.code ?? 'Unknown error';
        if (!error.response?.data) {
            resError = makeError('UNKNOWN', message, { error });
        } else {
            resError = isError(error.response?.data)
                ? error.response?.data
                : makeError('UNKNOWN', message, { payload: error?.response?.data });
        }
    }

    if (resError.code !== 'UNAUTHORIZED') {
        onError?.(resError);
    }

    return resError;
};

class ErrorResultError extends Error {
    public name = 'ErrorResultError';
    public constructor(public result: ResultError<any>) {
        super('ErrorResultError: ' + result.message);
    }
}
