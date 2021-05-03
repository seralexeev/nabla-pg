import { AntdEntityTable } from '@flstk/pg-react-antd';
import React, { FC } from 'react';
import { Orders } from './entities/OrderEntity';
import { Users } from './entities/UserEntity';

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
            <AntdEntityTable
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
