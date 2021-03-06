import { EntityAccessor, EntityBase, FieldSelector, InferPrimaryKey, OriginInfer } from '@flstk/pg-core';
import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import { FetchResultExtra } from '@flstk/use-api';
import { pick } from '@flstk/utils';
import React, { Fragment, ReactNode } from 'react';

type ExtraType<E extends EntityBase, S extends FieldSelector<E, S>> = FetchResultExtra<OriginInfer<E, S> | null>;

export type EntityByPkProps<E extends EntityBase, S extends FieldSelector<E, S>> = {
    accessor: EntityAccessor<E>;
    selector: S;
    pk: InferPrimaryKey<E>;
    renderLoading?: (extra: ExtraType<E, S>) => ReactNode;
    renderRefetching?: (extra: ExtraType<E, S>) => ReactNode;
    renderError?: (extra: ExtraType<E, S>) => ReactNode;
    renderEmpty?: (extra: ExtraType<E, S>) => ReactNode;
    children: (data: OriginInfer<E, S>, extra: ExtraType<E, S>) => ReactNode;
};

export const EntityByPk = <E extends EntityBase, S extends FieldSelector<E, S>>(props: EntityByPkProps<E, S>) => {
    const { accessor, children, renderError, renderLoading, renderRefetching, renderEmpty } = props;
    const [data, extra] = useEntityAccessor(accessor).findByPk.fetch(pick(props, ['pk', 'selector']));

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
