export type IdPkey = {
    id: DefaultValue<string>;
};

export type EntityBase<TName extends string = any, TPkey extends Record<string, unknown> = {}> = NominalType<
    TPkey,
    TPkey
> & {
    __typename: ReadonlyValue<TName>;
    updatedAt: ReadonlyValue<Date>;
    createdAt: ReadonlyValue<Date>;
} & Queryable;

export type ReadonlyValue<T> = NominalType<T, 'readonly'>;
export type DefaultValue<T> = NominalType<T, 'default'>;
export type EntityConnection<E> = { nodes: E[]; totalCount: number } & Queryable;
export type Queryable = NominalType<{}, 'queryable'>;

export type PrimaryKey<T> = T extends EntityBase<any, infer TPkey> ? UnwrapNominal<TPkey> : never;

export type OriginInfer<T, F extends FieldSelector<T, F> | unknown> = F extends { selector: FieldSelector<T, F> }
    ? OriginInferImpl<T, F['selector']>
    : OriginInferImpl<T, F>;

export type SelectorShape<T> = OriginInfer<UnwrapNominalTag<T>, T>;

type OriginInferImpl<T, F extends FieldSelector<T, F> | unknown> = F extends Array<keyof T>
    ? Pick<T, F[number]>
    : {
          [P in keyof F]: P extends keyof T
              ? F[P] extends true
                  ? T[P]
                  : T[P] extends Array<infer A>
                  ? Array<OriginInfer<A, F[P]>>
                  : null extends T[P]
                  ? OriginInfer<NonNullable<T[P]>, F[P]> | null
                  : OriginInfer<NonNullable<T[P]>, F[P]>
              : never;
      };

type SelectorWrapper<T, F> = {
    selector: FieldSelector<T, F>;
};

export type FieldSelector<E, S> =
    | Array<PrimitiveEntityKeys<E>>
    | {
          [P in keyof S]: P extends keyof E
              ? NonNullable<E[P]> extends Queryable
                  ? FieldSelector<NonNullable<E[P]>, S[P]> | SelectorWrapper<E[P], S[P]>
                  : E[P] extends Array<infer A>
                  ? A extends Queryable
                      ? FieldSelector<A, S[P]> | SelectorWrapper<A, S[P]>
                      : true
                  : true
              : never;
      };

export type EntityEntityKeys<T> = {
    [K in keyof T]: NonNullable<T[K]> extends Queryable ? K : NonNullable<T[K]> extends Queryable[] ? K : never;
}[keyof T];

export type PrimitiveEntityKeys<T> = Exclude<keyof NonNullable<T>, EntityEntityKeys<T>>;

export type EntityPatch<T, TPkey> = UnwrapNominal<
    Partial<Omit<T, keyof TPkey | keyof EntityBase | EntityEntityKeys<T>>>
>;

export type EntityReadonlyKeys<T> = {
    [K in keyof T]: NonNullable<T[K]> extends ReadonlyValue<unknown> ? K : never;
}[keyof T];

export type EntityDefaultKeys<T> = {
    [K in keyof T]: NonNullable<T[K]> extends DefaultValue<unknown> ? K : never;
}[keyof T];

export type EntityDefaults<T> = Pick<T, EntityDefaultKeys<T>>;

export type EntityCreate<T> = UnwrapNominal<
    Omit<
        Pick<T, NonNullableKeys<T>>,
        keyof EntityBase | EntityEntityKeys<T> | EntityReadonlyKeys<T> | EntityDefaultKeys<T>
    > &
        OnlyNullableAsUndefined<T> &
        Partial<EntityDefaults<T>>
>;

type MaybeNominalScalar<T> =
    | { isNull: boolean }
    | { equalTo: T }
    | { notEqualTo: T }
    | { distinctFrom: T }
    | { notDistinctFrom: T }
    | { in: T[] }
    | { notIn: T[] }
    | { lessThan: T }
    | { lessThanOrEqualTo: T }
    | { greaterThan: T }
    | { greaterThanOrEqualTo: T };

type Scalar<T> = MaybeNominalScalar<UnwrapNominal<T>>;

type StringFilter =
    | { includes: string }
    | { notIncludes: string }
    | { includesInsensitive: string }
    | { notIncludesInsensitive: string }
    | { startsWith: string }
    | { notStartsWith: string }
    | { startsWithInsensitive: string }
    | { notStartsWithInsensitive: string }
    | { endsWith: string }
    | { notEndsWith: string }
    | { endsWithInsensitive: string }
    | { notEndsWithInsensitive: string }
    | { like: string }
    | { notLike: string }
    | { likeInsensitive: string }
    | { similarTo: string }
    | { notSimilarTo: string };

// TODO: Add `contains`, and `containedBy`
type JsonFilter = { containsAllKeys: string[] } | { containsAnyKeys: string[] } | { containsKey: string };

type ConnectionFilter<Entity> = { some: Filter<Entity> } | { none: Filter<Entity> } | { every: Filter<Entity> };

type ArrayFilter<T> =
    | { isNull: boolean }
    | { equalTo: T[] }
    | { notEqualTo: T[] }
    | { distinctFrom: T[] }
    | { notDistinctFrom: T[] }
    | { lessThan: T[] }
    | { lessThanOrEqualTo: T[] }
    | { greaterThan: T[] }
    | { greaterThanOrEqualTo: T[] }
    | { contains: T[] }
    | { containedBy: T[] }
    | { overlaps: T[] }
    | { anyEqualTo: T }
    | { anyNotEqualTo: T }
    | { anyLessThan: T }
    | { anyLessThanOrEqualTo: T }
    | { anyGreaterThan: T }
    | { anyGreaterThanOrEqualTo: T };

export type Filter<T> =
    | {
          [P in keyof T]?: NonNullable<T[P]> extends EntityBase
              ? Filter<NonNullable<T[P]>>
              : NonNullable<T[P]> extends EntityConnection<infer Entity>
              ? ConnectionFilter<Entity>
              : T[P] extends JsonObject | null
              ? JsonFilter | Scalar<T[P]>
              : T[P] extends string | null
              ? Scalar<T[P]> | StringFilter
              : T[P] extends Array<infer A>
              ? A extends EntityBase
                  ? never
                  : ArrayFilter<A>
              : Scalar<T[P]>;
      }
    | { or: Array<Filter<T>> }
    | { and: Array<Filter<T>> }
    | { not: Filter<T> };

export type FindOptions<E> = {
    filter?: Filter<E>;
    first?: number;
    offset?: number;
    orderBy?: Array<[keyof E, 'ASC' | 'DESC']>;
};

export type Query<E, F extends FieldSelector<E, F>> = {
    selector: F;
} & FindOptions<E>;

export type ConnectionQuery<E, F extends FieldSelector<EntityConnection<E>, F>> = {
    selector: F;
} & FindOptions<E>;

export type NullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

export type NonNullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

export type OnlyNullableAsUndefined<T> = {
    [K in NullableKeys<T>]?: K extends keyof T ? T[K] : never;
};

export type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};

class TypeTag<TType, T> {
    protected __TYPE_TAG!: T;
    protected __TYPE!: TType;
}

export type NominalType<TType, TTag> = TType & TypeTag<TType, TTag>;
export type UnwrapNominal<T> = T extends TypeTag<infer N, any> ? N : T;
export type UnwrapNominalTag<T> = T extends TypeTag<any, infer N> ? N : T;

export type JsonObject = { [x: string]: Json };
export type Json = string | number | boolean | null | JsonObject | Json[];
