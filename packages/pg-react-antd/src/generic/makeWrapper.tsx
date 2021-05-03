import { EntityAccessor, EntityBase, FieldSelector } from '@flstk/pg-core';
import { EntityByPkProps } from '@flstk/pg-react';
import { AntdEntityByPk } from '@flstk/pg-react-antd/generic/AntdEntityByPk';
import { AntdEntityTable, AntdEntityTableProps } from '@flstk/pg-react-antd/generic/AntdEntityTable';
import React from 'react';

export const makeEntityWrapper = <E extends EntityBase>(accessor: EntityAccessor<E>) => {
    return {
        ByPk: <S extends FieldSelector<E, S>>(props: Omit<EntityByPkProps<E, S>, 'accessor'>) => {
            return <AntdEntityByPk accessor={accessor} {...props} />;
        },
        Table: <S extends FieldSelector<E, S>>(props: Omit<AntdEntityTableProps<E, S>, 'accessor'>) => {
            return <AntdEntityTable accessor={accessor} {...props} />;
        },
    };
};
