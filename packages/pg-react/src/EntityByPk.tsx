import { EntityAccessor, EntityBase, FieldSelector, InferPrimaryKey, OriginInfer } from '@flstk/pg-core';
import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import { FetchResultExtra } from '@flstk/use-api';
import React, { Fragment, ReactNode } from 'react';

export type EntityByPkProps<E extends EntityBase, S extends FieldSelector<E, S>> = {
    accessor: EntityAccessor<E>;
    selector: S;
    pk: InferPrimaryKey<E>;
    renderLoading?: (extra: FetchResultExtra<OriginInfer<E, S> | null>) => ReactNode;
    renderRefetching?: (extra: FetchResultExtra<OriginInfer<E, S> | null>) => ReactNode;
    renderError?: (extra: FetchResultExtra<OriginInfer<E, S> | null>) => ReactNode;
    renderEmpty?: (extra: FetchResultExtra<OriginInfer<E, S> | null>) => ReactNode;
    children: (data: OriginInfer<E, S>, extra: FetchResultExtra<OriginInfer<E, S> | null>) => ReactNode;
};

export const EntityByPk = <E extends EntityBase, S extends FieldSelector<E, S>>(props: EntityByPkProps<E, S>) => {
    const { accessor, children, pk, selector, renderError, renderLoading, renderRefetching, renderEmpty } = props;
    const [data, extra] = useEntityAccessor(accessor).findByPk.fetch({
        pk,
        selector,
    });

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
