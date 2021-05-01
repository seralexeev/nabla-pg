import { GqlClientProvider, useEntityAccessor } from '@flstk/pg-react';
import { AxiosProvider, AxiosProviderProps } from '@flstk/use-api';
import React, { useEffect, VFC } from 'react';
import { Users } from './entities/UserEntity';

const config: AxiosProviderProps = {
    config: {
        baseURL: 'http://localhost:3000/api',
    },
};

export const App: VFC = () => {
    return (
        <AxiosProvider {...config}>
            <GqlClientProvider path='/graphql'>
                <ExampleComponent />
            </GqlClientProvider>
        </AxiosProvider>
    );
};

const ExampleComponent: VFC = () => {
    const ent = useEntityAccessor(Users);
    const [data, { loading, refetch, refetching, error }] = ent.find.fetch({
        selector: ['id', 'name'],
    });

    useEffect(() => {
        ent.findByPkOrError({
            pk: { id: '26707f69-46ff-4c71-946d-d764a7a5d909' },
            selector: ['id'],
        }).then((res) => console.log('rrrres', JSON.stringify(res, null, 2)));
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
        </div>
    );
};
