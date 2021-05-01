export declare class TypeTag<TType, T> {
    protected __TYPE_TAG: T;
    protected __TYPE: TType;
}
export declare type NominalType<TType, TTag> = TType & TypeTag<TType, TTag>;
export declare type UnwrapNominalTag<T> = T extends TypeTag<any, infer N> ? N : T;
export declare type UnwrapNominal<T> = T extends Record<string, unknown> ? {
    [K in keyof T]: UnwrapNominal<T[K]>;
} : T extends TypeTag<infer N, any> ? N : T;
export declare type NullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];
export declare type NotNullableKeys<T> = {
    [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];
export declare type FilterKeys<T, F> = {
    [K in keyof T]: T[K] extends F ? K : never;
}[keyof T];
export declare type InverseFilterKeys<T, F> = {
    [K in keyof T]: T[K] extends F ? never : K;
}[keyof T];
export declare type ArrayElement<T> = T extends Array<infer A> ? A : never;
