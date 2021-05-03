import { EntityAccessor, EntityBase, FieldSelector, InferPrimaryKey, SelectorShape } from '@flstk/pg-core';
import { useEntityAccessor } from '@flstk/pg-react';
import * as antd from 'antd';
import React, { ReactNode } from 'react';

type EntityByPkProps<E extends EntityBase, S extends FieldSelector<E, S>> = {
    children: (data: OriginInfer<E, S>) => ReactNode;
    accessor: EntityAccessor<E>;
    selector: S;
    pk: InferPrimaryKey<E>;
};

export const EntityByPk = <E extends EntityBase, S extends FieldSelector<E, S>>(props: EntityByPkProps<E, S>) => {
    const { accessor, children, pk, selector } = props;
    const [data, { error, loading, refetch, refetching }] = useEntityAccessor(accessor).findByPk.fetch({
        pk,
        selector,
    });

    if (loading) {
        return <antd.Spin />;Îz
    }

    if (refetching) {
        return <antd.Spin />;
    }

    if (error) {
        return (
            <antd.Result
                status='500'
                title='An error has occurred'
                subTitle={error.message}
                extra={<antd.Button type='primary' children='Refetch' onClick={refetch} />}
            />
        );
    }

    if (!data) {
        return <antd.Empty />;
    }

    return children(data);
};
