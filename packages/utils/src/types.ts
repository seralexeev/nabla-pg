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
    [K in keyof T]: T[K] extends F ? never : K extends string ? K : never;
}[keyof T];

export type ArrayElement<T> = T extends Array<infer A> ? A : never;

export type SplitString<S, TSeparator extends string = ' '> = S extends `${infer TLeft}${TSeparator}${infer TRight}`
    ? [TLeft, ...SplitString<TRight, TSeparator>]
    : [S];

export type Class<T> = new (...args: any[]) => T;
