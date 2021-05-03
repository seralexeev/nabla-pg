import { EntityAccessor, EntityBase, FieldSelector, Filter, OrderBy, ReadonlyEntityAccessor } from '@flstk/pg-core';
import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import { UseFetchOptions } from '@flstk/use-api';
import { useMemo, useState } from 'react';

export type UseListFetcherOptions = UseFetchOptions<any> & {
    pageSize?: number;
};

export const useListFetcher = <E extends EntityBase, S extends FieldSelector<E, S>>(
    accessor: ReadonlyEntityAccessor<E>,
    query: {
        filter?: Filter<E>;
        orderBy?: OrderBy<E>;
        selector: S;
    },
    options: UseListFetcherOptions = {},
) => {
    const { pageSize: initialPageSize, ...fetchProps } = options;
    const [pageSize, setPageSize] = useState(initialPageSize ?? 10);
    const [page, setPage] = useState(1);
    const [data, rest] = useEntityAccessor(accessor as EntityAccessor<E>).findAndCount.fetch(
        { first: pageSize, offset: (page - 1) * pageSize, ...query },
        fetchProps,
    );

    const pagination = useMemo(
        () => ({
            current: page,
            total: data?.total || 0,
            pageSize,
            onChange: setPage,
            defaultPageSize: pageSize,
            showSizeChanger: true,
            onShowSizeChange: (current: number, size: number) => {
                setPageSize(size);
                setPage(current);
            },
        }),
        [data?.total, page, pageSize],
    );

    return [data, rest, pagination] as const;
};
