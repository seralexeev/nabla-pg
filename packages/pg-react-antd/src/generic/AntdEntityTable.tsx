import { EntityAccessor, EntityBase, FieldSelector, Filter, NonQueryableKeys, OrderBy, OriginInfer } from '@flstk/pg-core';
import { useListFetcher } from '@flstk/pg-react-antd/useListFetcher';
import { FilterKeys } from '@flstk/utils';
import * as antd from 'antd';
import { ColumnType, TableProps } from 'antd/lib/table';
import { capitalCase } from 'capital-case';
import React, { Fragment, ReactNode, useMemo } from 'react';

type AntdTableProps<E extends EntityBase, S extends FieldSelector<E, S>> = Omit<
    TableProps<S>,
    'columns' | 'dataSource' | 'rowKey'
>;

export type AntdEntityTableProps<E extends EntityBase, S extends FieldSelector<E, S>> = AntdTableProps<E, S> & {
    accessor: EntityAccessor<E>;
    filter?: Filter<E>;
    orderBy?: OrderBy<E>;
    selector: S;
    initialPageSize?: number;
    columns: Array<
        | FilterKeys<OriginInfer<E, S>, string | number>
        | [string, FilterKeys<OriginInfer<E, S>, string | number>]
        | [string, (x: OriginInfer<E, S>) => ReactNode]
        | ColumnType<OriginInfer<E, S>>
    >;
    rowKey: NonQueryableKeys<OriginInfer<E, S>> | ((x: OriginInfer<E, S>) => string);
    onQueryFilter?: (query: string) => Filter<E>;
};

export const AntdEntityTable = <E extends EntityBase, S extends FieldSelector<E, S>>(props: AntdEntityTableProps<E, S>) => {
    const { accessor, filter, selector, orderBy, initialPageSize, onQueryFilter, columns, rowKey, ...rest } = props;

    const [data, { loading, refetch }, pagination] = useListFetcher<E, S>(
        accessor,
        {
            selector,
            filter: filter,
            orderBy,
        },
        { pageSize: initialPageSize },
    );

    const mappedColumns: Array<ColumnType<OriginInfer<E, S>>> = useMemo(() => {
        return columns.map((x) => {
            if (typeof x === 'string') {
                return { title: capitalCase(x), render: (_, record) => record[x] } as ColumnType<OriginInfer<E, S>>;
            } else if (Array.isArray(x)) {
                const [title, keyOrSelector] = x;
                const render =
                    typeof keyOrSelector === 'string' ? (_: any, record: any) => record[keyOrSelector] : keyOrSelector;

                return { title, render } as ColumnType<OriginInfer<E, S>>;
            } else {
                return x as ColumnType<OriginInfer<E, S>>;
            }
        });
    }, [columns]);

    return (
        <Fragment>
            {loading ? (
                <antd.Spin />
            ) : !data ? (
                <antd.Empty />
            ) : (
                <antd.Table
                    columns={mappedColumns as any}
                    dataSource={data.items as any}
                    pagination={pagination}
                    rowKey={rowKey as any}
                    {...(rest as any)}
                />
            )}
        </Fragment>
    );
};
