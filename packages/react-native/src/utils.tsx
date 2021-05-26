import { styleModsFactory, withStyleModsFactory } from '@flstk/react-core';
import { ImageStyle, StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';

export type RnStyle = ViewStyle | ImageStyle | TextStyle;

export function styleCompose(...styles: Array<StyleProp<ViewStyle>>): StyleProp<ViewStyle>;
export function styleCompose(...styles: Array<StyleProp<ImageStyle>>): StyleProp<ImageStyle>;
export function styleCompose(...styles: Array<StyleProp<TextStyle>>): StyleProp<TextStyle>;
export function styleCompose(...styles: any[]) {
    if (styles.length === 1) {
        return styles[0];
    }

    if (styles.length <= 2) {
        return StyleSheet.compose(styles[0], styles[1]);
    }

    return styles.filter(Boolean);
}

export const reactNativeStyleMods = styleModsFactory<RnStyle>();
export const withReactNativeStyleMods = withStyleModsFactory(styleCompose);
