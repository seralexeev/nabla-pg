import { EntityCreate, EntityPatch, InferPrimaryKey, NonQueryableKeys } from '@flstk/pg-core/entity';
import { Filter } from '@flstk/pg-core/filter';
import { OriginInfer } from '@flstk/pg-core/selector';

export type OrderBy<E> = Array<[NonQueryableKeys<E>, 'ASC' | 'DESC']>;

export type Query<E> = {
    filter?: Filter<E>;
    first?: number;
    offset?: number;
    orderBy?: OrderBy<E>;
};

export type SelectQuery<E, S> = { selector: S } & Query<E>;
export type FindOneQuery<E, S> = Omit<SelectQuery<E, S>, 'first'>;
export type ConnectionQuery<E, S> = SelectQuery<E, S>;

export type ByPkQuery<E, S> = {
    pk: InferPrimaryKey<E>;
    selector?: S;
};

export type UpdateMutation<E, S> = {
    pk: InferPrimaryKey<E>;
    patch?: EntityPatch<E>;
    selector?: S;
};

export type CreateMutation<E, S> = {
    item: EntityCreate<E>;
    selector?: S;
};

export type DeleteMutation<E, S> = {
    pk: InferPrimaryKey<E>;
    selector?: S;
};

export type CountResult = { total: number };
export type FindAndCountResult<E, S> = CountResult & {
    items: Array<OriginInfer<E, S>>;
};
