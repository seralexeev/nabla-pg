import { AsyncResult } from '@flstk/result';
import { FetchResultExtra, useFetch } from '@flstk/use-api/useFetch';
import React, { Fragment, ReactElement, ReactNode } from 'react';

type ExtraType<E, R> = FetchResultExtra<E, R>;

type CommonLoaderProps<R, E> = {
    renderLoading?: (extra: ExtraType<R, E>) => ReactNode;
    renderRefetching?: (extra: ExtraType<R, E>) => ReactNode;
    renderError?: (extra: ExtraType<R, E>) => ReactNode;
    renderEmpty?: (extra: ExtraType<R, E>) => ReactNode;
    children: (data: R, extra: ExtraType<R, E>) => ReactNode;
};

type EmptyLoaderProps<R, E> = CommonLoaderProps<R, E> & {
    caller: () => AsyncResult<R, E>;
};

type ParamsLoaderProps<R, E, P extends any[]> = CommonLoaderProps<R, E> & {
    caller: (...args: P) => AsyncResult<R, E>;
    args: P;
};

export function Loader<R, E>(props: EmptyLoaderProps<R, E>): ReactElement<any, any> | null;
export function Loader<R, E, P extends any[]>(props: ParamsLoaderProps<R, E, P>): ReactElement<any, any> | null;
export function Loader<R, E>(props: any): ReactElement<any, any> | null {
    const [data, extra] = useFetch(props.caller, { args: props.args });

    const { children, renderError, renderLoading, renderRefetching, renderEmpty } = props;

    if (extra.loading && renderLoading) {
        return <Fragment children={renderLoading(extra)} />;
    }

    if (extra.refetching && renderRefetching) {
        return <Fragment children={renderRefetching(extra)} />;
    }

    if (extra.error && renderError) {
        return <Fragment children={renderError(extra)} />;
    }

    if (!data) {
        return <Fragment children={renderEmpty ? renderEmpty(extra) : null} />;
    }

    return <Fragment children={children(data, extra)} />;
}
