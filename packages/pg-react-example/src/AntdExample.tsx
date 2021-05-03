import { EntityTable } from '@flstk/pg-react-antd';
import { useListFetcher } from '@flstk/pg-react-antd';
import { UserEntity, Users } from './entities/UserEntity';
import { Orders } from './entities/OrderEntity';
import React, { FC } from 'react';

export const AntdExample: FC = () => {
    const selector = Users.createSelector({
        id: true,
        name: true,
        orders: Orders.createQuery({
            selector: ['id', 'comment'],
            orderBy: [['comment', 'DESC']],
        }),
    });

    return (
        <div>
            <EntityTable
                accessor={Users}
                selector={selector}
                rowKey='id'
                columns={[
                    'id',
                    'name',
                    ['Orders Count', (x) => x.orders.length],
                    ['Last order comment', (x) => x.orders[0]?.comment ?? ' - '],
                    { title: 'Random date', render: (_, x) => new Date().getTime(), width: 128 },
                ]}
                size='small'
                bordered
                showHeader
            />
        </div>
    );
};
