import { FilterKeys, InverseFilterKeys, NominalType, NullableKeys, UnwrapNominal } from '@nabla/utils/types';

export type IdPkey = { id: DefaultValue<string> };

export type ReadonlyValue<T> = NominalType<T, 'readonly'>;
export type DefaultValue<T> = NominalType<T, 'default'>;
export type Queryable = NominalType<{}, 'queryable'>;
export type EntityConnection<E> = { nodes: E[]; totalCount: number } & Queryable;

export type InferPrimaryKey<T> = T extends EntityBase<infer TPkey> ? UnwrapNominal<TPkey> : never;
export type MayBeQueryable = EntityConnection<any> | Queryable | Queryable[] | (Queryable | null);
export type NonQueryableKeys<E> = InverseFilterKeys<E, MayBeQueryable>;
export type QueryableKeys<E> = FilterKeys<E, MayBeQueryable>;
export type ReadonlyKeys<E> = FilterKeys<E, ReadonlyValue<unknown>>;
export type DefaultKeys<E> = FilterKeys<E, DefaultValue<unknown>>;

export type EntityBase<TPkey extends Record<string, unknown> = {}> = NominalType<TPkey, TPkey> & {
    updatedAt: ReadonlyValue<Date>;
    createdAt: ReadonlyValue<Date>;
    selector: never;
} & Queryable;

export type Many2Many<TExtend> = TExtend &
    EntityBase<{ [TKey in keyof TExtend as TKey extends string ? `${TKey}Id` : never]: string }>;

export type EntityPatch<E> = UnwrapNominal<
    Partial<Omit<E, keyof InferPrimaryKey<E> | QueryableKeys<E> | ReadonlyKeys<E>>>
>;

export type EntityCreate<E> = EntityCreateImpl<Pick<E, NonQueryableKeys<E>>>;
type EntityCreateImpl<E> = Partial<Pick<E, NullableKeys<E> | DefaultKeys<E>>> &
    Omit<E, NullableKeys<E> | DefaultKeys<E> | ReadonlyKeys<E>>;

export type JsonObject = { [x: string]: Json };
export type Json = string | number | boolean | null | JsonObject | Json[];
