import { NonQueryableKeys, Queryable } from './entity';
import { UnwrapNominalTag } from './types';

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
    | Array<NonQueryableKeys<E>>
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
