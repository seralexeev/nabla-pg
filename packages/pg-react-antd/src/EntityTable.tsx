import {
    EntityBase,
    FieldSelector,
    Filter,
    NonQueryableKeys,
    OrderBy,
    ReadonlyEntityAccessor,
    SelectorShape,
} from '@flstk/pg-core';
import { useListFetcher } from '@flstk/pg-react-antd/useListFetcher';
import { FilterKeys } from '@flstk/utils/types';
import * as antd from 'antd';
import { ColumnType, TableProps } from 'antd/lib/table';
import { capitalCase } from 'capital-case';
import React, { Fragment, ReactNode, useMemo } from 'react';

type AntdTableProps<E extends EntityBase, S extends FieldSelector<E, S>> = Omit<
    TableProps<S>,
    'columns' | 'dataSource'
>;

type EntityTableProps<E extends EntityBase, S extends FieldSelector<E, S>> = AntdTableProps<E, S> & {
    accessor: ReadonlyEntityAccessor<E>;
    filter?: Filter<E>;
    orderBy?: OrderBy<E>;
    selector: S;
    initialPageSize?: number;
    columns: Array<
        | FilterKeys<SelectorShape<S>, string | number>
        | [string, FilterKeys<SelectorShape<S>, string | number>]
        | [string, (x: SelectorShape<S>) => ReactNode]
        | ColumnType<SelectorShape<S>>
    >;
    rowKey: NonQueryableKeys<SelectorShape<S>> | ((x: SelectorShape<S>) => string);
    onQueryFilter?: (query: string) => Filter<E>;
};

export const EntityTable = <E extends EntityBase, S extends FieldSelector<E, S>>(props: EntityTableProps<E, S>) => {
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

    const mappedColumns: Array<ColumnType<SelectorShape<S>>> = useMemo(() => {
        return columns.map((x) => {
            if (typeof x === 'string') {
                return { title: capitalCase(x), render: (_, record) => record[x] } as ColumnType<SelectorShape<S>>;
            } else if (Array.isArray(x)) {
                const [title, keyOrSelector] = x;
                const render =
                    typeof keyOrSelector === 'string' ? (_: any, record: any) => record[keyOrSelector] : keyOrSelector;

                return { title, render } as ColumnType<SelectorShape<S>>;
            } else {
                return x as ColumnType<SelectorShape<S>>;
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
