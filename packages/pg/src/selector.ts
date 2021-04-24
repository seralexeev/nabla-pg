import { EntityConnection, NonQueryableKeys, Queryable } from '@flstk/pg/entity';
import { SelectQuery } from '@flstk/pg/query';
import { ArrayElement, UnwrapNominal, UnwrapNominalTag } from '@flstk/utils/types';

export type OriginInfer<E, S extends FieldSelector<E, S> | unknown> = S extends { selector: FieldSelector<E, S> }
    ? OriginInferImpl<E, S['selector']>
    : OriginInferImpl<E, S>;

export type SelectorShape<T> = OriginInfer<UnwrapNominalTag<T>, T>;

type OriginInferImpl<E, S extends FieldSelector<E, S> | unknown> = S extends keyof E
    ? UnwrapNominal<Pick<E, S>>
    : S extends Array<keyof E>
    ? UnwrapNominal<Pick<E, S[number]>>
    : {
          [P in keyof S]: P extends keyof E
              ? S[P] extends true
                  ? UnwrapNominal<E[P]>
                  : E[P] extends Array<infer A>
                  ? Array<OriginInfer<A, S[P]>>
                  : null extends E[P]
                  ? OriginInfer<NonNullable<E[P]>, S[P]> | null
                  : OriginInfer<NonNullable<E[P]>, S[P]>
              : never;
      };

type NonArrayQueryable = EntityConnection<any> | Queryable | (Queryable | null);

// prettier-ignore
export type FieldSelector<E, S> =
    | NonQueryableKeys<E>
    | Array<NonQueryableKeys<E>>
    | {
          [K in keyof E]?: keyof S extends keyof E
              ? E[K] extends Queryable[]                             // @ts-expect-error
                  ? SelectQuery<E, FieldSelector<ArrayElement<E[K]>, S[K]>>
                  : E[K] extends NonArrayQueryable   // @ts-expect-error
                  ? FieldSelector<NonNullable<E[K]>, S[K]>
                  : true
              : never;
      };
