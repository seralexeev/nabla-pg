import { EntityBase, FieldSelector } from '@flstk/pg-core';
import { EntityByPk, EntityByPkProps } from '@flstk/pg-react';
import * as antd from 'antd';
import React from 'react';

export const AntdEntityByPk = <E extends EntityBase, S extends FieldSelector<E, S>>(props: EntityByPkProps<E, S>) => {
    return (
        <EntityByPk
            pk={props.pk}
            accessor={props.accessor}
            selector={props.selector}
            renderEmpty={props.renderEmpty ?? (() => <antd.Empty />)}
            renderLoading={props.renderLoading ?? (() => <antd.Spin />)}
            renderRefetching={props.renderRefetching ?? (() => <antd.Spin />)}
            renderError={
                props.renderError ??
                (({ error, refetch }) => (
                    <antd.Result
                        status='500'
                        title='An error has occurred'
                        subTitle={(error as any)?.message}
                        extra={<antd.Button type='primary' children='Refetch' onClick={refetch} />}
                    />
                ))
            }
            children={props.children}
        />
    );
};
