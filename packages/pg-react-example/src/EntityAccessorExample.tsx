import { makeEntityWrapper } from '@flstk/pg-react-antd';
import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import { createApiHook, Loader } from '@flstk/use-api';
import React, { useEffect, VFC } from 'react';
import { Orders } from './entities/OrderEntity';
import { Users as UsersAccessor } from './entities/UserEntity';

const Users = makeEntityWrapper(UsersAccessor);

const useApi = createApiHook({
    status: ({ get }) => () => {
        return get(`https://httpbin.org/get`);
    },
});

export const EntityAccessorExample: VFC = () => {
    const ent = useEntityAccessor(UsersAccessor);
    const [data, { loading, refetch, refetching, error }] = ent.find.fetch({
        selector: ['id', 'name'],
        first: 2,
    });

    useEffect(() => {
        ent.findByPkOrError({
            pk: { id: '26707f69-46ff-4c71-946d-d764a7a5d909' },
            selector: ['id'],
        }).then(console.log);
    }, []);

    if (loading) {
        return <pre>loading...</pre>;
    }

    if (refetching) {
        return <pre>refetching...</pre>;
    }

    if (error) {
        return <pre>{JSON.stringify(error, null, 2)}</pre>;
    }

    return (
        <div>
            <h1>
                Data from server <button onClick={refetch}>refetch</button>
            </h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <Users.FindByPk
                pk={{ id: '0006834c-a3f5-44dd-8072-5f5b42ea82f3' }}
                selector={['id', 'name']}
                children={(x, { refetch }) => (
                    <div>
                        <button onClick={refetch}>refetch</button>
                        <pre>{JSON.stringify(x, null, 2)}</pre>
                    </div>
                )}
            />
            <Users.Find
                selector={['id', 'name']}
                children={(data, { refetch }) => (
                    <div>
                        <button onClick={refetch}>refetch</button>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                )}
            />
            <Users.Table
                selector={{
                    id: true,
                    name: true,
                    orders: Orders.createQuery({ selector: ['id', 'comment'], orderBy: [['comment', 'DESC']] }),
                }}
                rowKey='id'
                columns={[
                    'id',
                    'name',
                    ['Orders Count', (x) => x.orders.length],
                    ['Last order comment', (x) => x.orders[0]?.comment ?? ' - '],
                ]}
                size='small'
                bordered
                showHeader
            />
            {/* <Loader caller={() => useApi((x) => x.status)} children={(data) => <pre>{JSON.stringify(data)}</pre>} />; */}
        </div>
    );
};
