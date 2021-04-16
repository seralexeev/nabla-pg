import { EntityConnection, EntityCreate, EntityPatch, InferPrimaryKey, NonQueryableKeys } from './entity';
import { Filter } from './filter';
import { FieldSelector, OriginInfer } from './selector';

type OrderBy<E> = Array<[NonQueryableKeys<E>, 'ASC' | 'DESC']>;

export type Query<E> = {
    filter?: Filter<E>;
    first?: number;
    offset?: number;
    orderBy?: OrderBy<E>;
};

export type SelectQuery<E, S> = { selector: S } & Query<E>;

export type FindOneQuery<E, S extends FieldSelector<E, S>> = Omit<SelectQuery<E, S>, 'first'>;

export type ConnectionQuery<E, F extends FieldSelector<EntityConnection<E>, F>> = SelectQuery<E, F>;

export type ByPkQuery<E, S extends FieldSelector<E, S>> = {
    pk: InferPrimaryKey<E>;
    selector?: S;
};

export type UpdateMutation<E, S extends FieldSelector<E, S>> = {
    pk: InferPrimaryKey<E>;
    patch?: EntityPatch<E>;
    selector?: S;
};

export type CreateMutation<E, S extends FieldSelector<E, S>> = {
    item: EntityCreate<E>;
    selector?: S;
};

export type DeleteMutation<E, S extends FieldSelector<E, S>> = {
    pk: InferPrimaryKey<E>;
    selector?: S;
};

export type CountResult = { total: number };
export type FindAndCountResult<E, S extends FieldSelector<E, S>> = CountResult & {
    items: Array<OriginInfer<E, S>>;
};

export type GqlInvoke = <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;
export type GqlClient = { gql: GqlInvoke };
