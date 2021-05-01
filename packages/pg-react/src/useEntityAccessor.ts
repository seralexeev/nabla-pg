import { EntityBase } from '@flstk/pg-core/entity';
import { EntityAccessor } from '@flstk/pg-core/EntityAccessor';
import {
    ByPkQuery,
    CountResult,
    CreateMutation,
    FindAndCountResult,
    FindOneQuery,
    Query,
    SelectQuery,
    UpdateMutation
} from '@flstk/pg-core/query';
import { FieldSelector, OriginInfer } from '@flstk/pg-core/selector';
import { useGraphQLClient } from '@flstk/pg-react/GqlProvider';
import { AsyncResult } from '@flstk/result';
import { useFetch, UseFetchOptions } from '@flstk/use-api/useFetch';
import { useMemo } from 'react';

export const useEntityAccessor = <E extends EntityBase>(repo: EntityAccessor<E>) => {
    const client = useGraphQLClient();

    return useMemo(() => {
        const find = <S extends FieldSelector<E, S>>(query: SelectQuery<E, S>) => {
            return repo.find(client, query);
        };

        const findAndCount = <S extends FieldSelector<E, S>>(query: SelectQuery<E, S>) => {
            return repo.findAndCount(client, query);
        };

        const count = (query?: Query<E>) => {
            return repo.count(client, query);
        };

        const findOne = <S extends FieldSelector<E, S>>(query: FindOneQuery<E, S>) => {
            return repo.findOne(client, query);
        };

        const findOneOrError = <S extends FieldSelector<E, S>>(query: FindOneQuery<E, S>) => {
            return repo.findOneOrError(client, query);
        };

        const findByPk = <S extends FieldSelector<E, S>>(query: ByPkQuery<E, S>) => {
            return repo.findByPk(client, query);
        };

        const findByPkOrError = <S extends FieldSelector<E, S>>(query: ByPkQuery<E, S>) => {
            return repo.findByPkOrError(client, query);
        };

        const update = <S extends FieldSelector<E, S>>(query: UpdateMutation<E, S>) => {
            return repo.update(client, query) as AsyncResult<OriginInfer<E, S>>;
        };

        const create = <S extends FieldSelector<E, S>>(query: CreateMutation<E, S>) => {
            return repo.create(client, query) as AsyncResult<OriginInfer<E, S>>;
        };

        return {
            find: <S extends FieldSelector<E, S>>(
                query: SelectQuery<E, S>,
                options?: UseFetchOptions<Array<OriginInfer<E, S>>>,
            ) => useFetch(find, { args: [query], ...options }),
            findAndCount: <S extends FieldSelector<E, S>>(
                query: SelectQuery<E, S>,
                options?: UseFetchOptions<FindAndCountResult<E, S>>,
            ) => useFetch(findAndCount, { args: [query], ...options }),
            count: (query?: Query<E>, options?: UseFetchOptions<CountResult>) =>
                useFetch(count, { args: [query], ...options }),
            findOne: <S extends FieldSelector<E, S>>(
                query: FindOneQuery<E, S>,
                options?: UseFetchOptions<OriginInfer<E, S> | null>,
            ) => useFetch(findOne, { args: [query], ...options }),
            findOneOrError: <S extends FieldSelector<E, S>>(
                query: FindOneQuery<E, S>,
                options?: UseFetchOptions<OriginInfer<E, S>>,
            ) => useFetch(findOneOrError, { args: [query], ...options }),
            findByPk: <S extends FieldSelector<E, S>>(
                query: ByPkQuery<E, S>,
                options?: UseFetchOptions<OriginInfer<E, S> | null>,
            ) => useFetch(findByPk, { args: [query], ...options }),
            findByPkOrError: <S extends FieldSelector<E, S>>(
                query: ByPkQuery<E, S>,
                options?: UseFetchOptions<OriginInfer<E, S>>,
            ) => useFetch(findByPkOrError, { args: [query], ...options }),
            update,
            create,
        };
    }, [client, repo]);
};
