import { EntityAccessor, EntityBase, FieldSelector, Filter, OrderBy, OriginInfer } from '@flstk/pg-core';
import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import { FetchResultExtra } from '@flstk/use-api';
import { pick } from '@flstk/utils';
import React, { Fragment, ReactNode } from 'react';

type ExtraType<E extends EntityBase, S extends FieldSelector<E, S>> = FetchResultExtra<Array<OriginInfer<E, S>>>;

export type EntitiesByFilterProps<E extends EntityBase, S extends FieldSelector<E, S>> = {
    accessor: EntityAccessor<E>;
    selector: S;
    filter?: Filter<E>;
    first?: number;
    offset?: number;
    orderBy?: OrderBy<E>;
    renderLoading?: (extra: ExtraType<E, S>) => ReactNode;
    renderRefetching?: (extra: ExtraType<E, S>) => ReactNode;
    renderError?: (extra: ExtraType<E, S>) => ReactNode;
    renderEmpty?: (extra: ExtraType<E, S>) => ReactNode;
    children: (data: Array<OriginInfer<E, S>>, extra: ExtraType<E, S>) => ReactNode;
};

export const EntitiesByFilter = <E extends EntityBase, S extends FieldSelector<E, S>>(
    props: EntitiesByFilterProps<E, S>,
) => {
    const { accessor, children, renderError, renderLoading, renderRefetching, renderEmpty } = props;
    const [data, extra] = useEntityAccessor(accessor).find.fetch(
        pick(props, ['filter', 'selector', 'first', 'offset', 'orderBy']),
    );

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
};
