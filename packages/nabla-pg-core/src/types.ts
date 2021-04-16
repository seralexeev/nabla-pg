export class TypeTag<TType, T> {
    protected __TYPE_TAG!: T;
    protected __TYPE!: TType;
}

export type NominalType<TType, TTag> = TType & TypeTag<TType, TTag>;
export type UnwrapNominalTag<T> = T extends TypeTag<any, infer N> ? N : T;
export type UnwrapNominal<T> = T extends Record<string, unknown>
    ? { [K in keyof T]: UnwrapNominal<T[K]> }
    : T extends TypeTag<infer N, any>
    ? N
    : T;

export type NullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

export type NotNullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

export type FilterKeys<T, F> = {
    [K in keyof T]: T[K] extends F ? K : never;
}[keyof T];

export type InverseFilterKeys<T, F> = {
    [K in keyof T]: T[K] extends F ? never : K;
}[keyof T];

export type Strict<E, S> = {
    [K in keyof S]: K extends keyof E ? S[K] : never;
};
