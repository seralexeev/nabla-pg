import { FC } from 'react';

export type ModsMap<TStyles> = Record<string, TStyles | ((propValue: any) => TStyles)>;
type AnyFunction = (...args: any[]) => any;

type InferParam<Fn extends AnyFunction> = {
    [P in keyof Parameters<Fn>]: {} extends Pick<Parameters<Fn>, P> ? Parameters<Fn>[0] | boolean : Parameters<Fn>[0];
}[0];

export type ModsProps<M extends ModsMap<any>> = {
    [P in keyof M]+?: M[P] extends AnyFunction ? InferParam<M[P]> : boolean;
};

export type BaseProps = { style?: any };
export type Wrapper<TProps, TMap extends ModsMap<any>> = FC<TProps & ModsProps<TMap> & (React.RefAttributes<any> | React.ClassAttributes<any>)>;

export type InferStyleValue<TMap extends ModsMap<any>> = TMap extends ModsMap<infer T> ? T : never;

export type Compose<T, P = any> = (...style: P[]) => T;
