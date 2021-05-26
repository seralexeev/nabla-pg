import { Compose, ModsMap, Wrapper } from '@flstk/react-core/propMods/types';
import { isBoolean, isFunction } from 'lodash';
import React, { ComponentType, CSSProperties, forwardRef } from 'react';

export const styleModsFactory = <StylesValue,>() => {
    return <TMap extends ModsMap<TStyleValue>, TStyleValue extends StylesValue>(map: TMap) => {
        return map;
    };
};

export const withStyleModsFactory = <TStyle,>(compose: Compose<TStyle> = Object.assign) => {
    return <TMap extends ModsMap<any>>(map: TMap) => {
        return withStyleMods(map, compose);
    };
};

export const withStyleMods = <TMap extends ModsMap<any>, TStyle = any>(map: TMap, compose: (...styles: any) => TStyle) => {
    return <P extends { style?: TStyle }>(Component: ComponentType<P>): Wrapper<P, TMap> => {
        return forwardRef((props: any, ref: any) => {
            const [modsStyle, restProps] = splitStyleProps(props, map);
            const style = compose({}, props.style, modsStyle);
            return <Component {...restProps} style={style} ref={ref} />;
        }) as any;
    };
};

const resolveProp = (prop: any, mod: any) => {
    if (isFunction(mod)) {
        if (isBoolean(prop)) {
            return prop === true ? mod() : undefined;
        }
        return mod(prop);
    }

    return prop ? mod : undefined;
};

const splitStyleProps = (props: Record<string, any>, mods: ModsMap<any>) => {
    const modsStyle: Record<string, any> = {};
    const restProps: any = {};

    for (const prop in props) {
        if (prop in mods) {
            Object.assign(modsStyle, resolveProp(props[prop], mods[prop]));
        } else {
            restProps[prop] = props[prop];
        }
    }
    return [modsStyle, restProps];
};

export function valueModFactory<T>() {
    function createValueModImpl<P extends keyof T>(key: P): (value: T[P]) => T;
    function createValueModImpl<P extends keyof T>(key: P, defaultValue: T[P] | (() => T[P])): (value?: T[P]) => T;
    function createValueModImpl(key: string, defaultValue?: any) {
        return (value: any) => ({ [key]: value ?? (typeof defaultValue === 'function' ? defaultValue() : defaultValue) });
    }

    return createValueModImpl;
}

export const styleMods = styleModsFactory<CSSProperties>();
