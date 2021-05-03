import { useEntityAccessor } from '@flstk/pg-react/useEntityAccessor';
import React, { useEffect, VFC } from 'react';
import { Users } from './entities/UserEntity';

export const EntityAccessorExample: VFC = () => {
    const ent = useEntityAccessor(Users);
    const [data, { loading, refetch, refetching, error }] = ent.find.fetch({
        selector: ['id', 'name'],
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
        </div>
    );
};
