import { UnwrapNominal } from '@nabla/utils/types';
import { EntityBase, EntityConnection, JsonObject } from './entity';

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

// TODO: Add `contains`, and `containedBy`
type JsonFilter = { containsAllKeys: string[] } | { containsAnyKeys: string[] } | { containsKey: string };

type ConnectionFilter<Entity> = { some: Filter<Entity> } | { none: Filter<Entity> } | { every: Filter<Entity> };
