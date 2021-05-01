import {
    ByPkQuery,
    CountResult,
    CreateMutation,
    EntityAccessor,
    EntityBase,
    FieldSelector,
    FindAndCountResult,
    FindOneQuery,
    OriginInfer,
    Query,
    SelectQuery,
    UpdateMutation,
} from '@flstk/pg-core';
import { useGraphQLClient } from '@flstk/pg-react/GqlProvider';
import { AsyncResult, isError, makeErrorFromError, ResultErrorWrapper } from '@flstk/result';
import { useFetch, UseFetchOptions } from '@flstk/use-api';
import { useMemo } from 'react';

const makeGqlError = (error: any) => {
    if (ResultErrorWrapper.isResultError(error)) {
        return error.error;
    }

    if (isError(error)) {
        return error;
    }

    return makeErrorFromError(error);
};

export const useEntityAccessor = <E extends EntityBase>(accessor: EntityAccessor<E>) => {
    const client = useGraphQLClient();

    return useMemo(() => {
        const find = <S extends FieldSelector<E, S>>(query: SelectQuery<E, S>) => {
            return accessor.find(client, query).catch(makeGqlError);
        };

        find.fetch = <S extends FieldSelector<E, S>>(
            query: SelectQuery<E, S>,
            options?: UseFetchOptions<Array<OriginInfer<E, S>>>,
        ) => useFetch(find, { args: [query], ...options });

        const findAndCount = <S extends FieldSelector<E, S>>(query: SelectQuery<E, S>) => {
            return accessor.findAndCount(client, query).catch(makeGqlError);
        };

        findAndCount.fetch = <S extends FieldSelector<E, S>>(
            query: SelectQuery<E, S>,
            options?: UseFetchOptions<FindAndCountResult<E, S>>,
        ) => useFetch(findAndCount, { args: [query], ...options });

        const count = (query?: Query<E>) => {
            return accessor.count(client, query).catch(makeGqlError);
        };

        count.fetch = (query?: Query<E>, options?: UseFetchOptions<CountResult>) => {
            return useFetch(count, { args: [query], ...options });
        };

        const findOne = <S extends FieldSelector<E, S>>(query: FindOneQuery<E, S>) => {
            return accessor.findOne(client, query).catch(makeGqlError);
        };

        findOne.fetch = <S extends FieldSelector<E, S>>(
            query: FindOneQuery<E, S>,
            options?: UseFetchOptions<OriginInfer<E, S> | null>,
        ) => useFetch(findOne, { args: [query], ...options });

        const findOneOrError = <S extends FieldSelector<E, S>>(query: FindOneQuery<E, S>) => {
            return accessor.findOneOrError(client, query).catch(makeGqlError);
        };

        findOneOrError.fetch = <S extends FieldSelector<E, S>>(
            query: FindOneQuery<E, S>,
            options?: UseFetchOptions<OriginInfer<E, S>>,
        ) => useFetch(findOneOrError, { args: [query], ...options });

        const findByPk = <S extends FieldSelector<E, S>>(query: ByPkQuery<E, S>) => {
            return accessor.findByPk(client, query).catch(makeGqlError);
        };

        findByPk.fetch = <S extends FieldSelector<E, S>>(
            query: ByPkQuery<E, S>,
            options?: UseFetchOptions<OriginInfer<E, S> | null>,
        ) => useFetch(findByPk, { args: [query], ...options });

        const findByPkOrError = <S extends FieldSelector<E, S>>(query: ByPkQuery<E, S>) => {
            return accessor.findByPkOrError(client, query).catch(makeGqlError);
        };

        findByPkOrError.fetch = <S extends FieldSelector<E, S>>(
            query: ByPkQuery<E, S>,
            options?: UseFetchOptions<OriginInfer<E, S>>,
        ) => useFetch(findByPkOrError, { args: [query], ...options });

        const update = <S extends FieldSelector<E, S>>(query: UpdateMutation<E, S>) => {
            return accessor.update(client, query).catch(makeGqlError) as AsyncResult<OriginInfer<E, S>>;
        };

        const create = <S extends FieldSelector<E, S>>(query: CreateMutation<E, S>) => {
            return accessor.create(client, query).catch(makeGqlError) as AsyncResult<OriginInfer<E, S>>;
        };

        return {
            find,
            findAndCount,
            count,
            findOne,
            findOneOrError,
            findByPk,
            findByPkOrError,
            update,
            create,
        };
    }, [client, accessor]);
};
