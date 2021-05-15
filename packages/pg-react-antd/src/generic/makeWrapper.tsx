import { EntityAccessor, EntityBase, FieldSelector } from '@flstk/pg-core';
import { EntitiesByFilterProps, EntityByPkProps } from '@flstk/pg-react';
import { AntdEntitiesByFilter } from '@flstk/pg-react-antd/generic/AntdEntitiesByFilter';
import { AntdEntityByPk } from '@flstk/pg-react-antd/generic/AntdEntityByPk';
import { AntdEntityTable, AntdEntityTableProps } from '@flstk/pg-react-antd/generic/AntdEntityTable';
import React from 'react';

export const makeEntityWrapper = <E extends EntityBase>(accessor: EntityAccessor<E>) => {
    return {
        FindByPk: <S extends FieldSelector<E, S>>(props: Omit<EntityByPkProps<E, S>, 'accessor'>) => {
            return <AntdEntityByPk accessor={accessor} {...props} />;
        },
        Find: <S extends FieldSelector<E, S>>(props: Omit<EntitiesByFilterProps<E, S>, 'accessor'>) => {
            return <AntdEntitiesByFilter accessor={accessor} {...props} />;
        },
        Table: <S extends FieldSelector<E, S>>(props: Omit<AntdEntityTableProps<E, S>, 'accessor'>) => {
            return <AntdEntityTable accessor={accessor} {...props} />;
        },
    };
};
