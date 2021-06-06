import { ModsProps } from '@flstk/react-core';
import { spacingMods } from '@flstk/react-native/ui-kit/mods/spacingMods';
import { StyleGuide } from '@flstk/react-native/ui-kit/StyleGuide';
import { rnStyleMods, styleCompose, withRnStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import * as ReactNative from 'react-native';

const { Platform } = ReactNative;
type TextStyle = ReactNative.TextStyle;

const applyDefaultProps = (Component: any) => {
    Component.defaultProps = Component.defaultProps || {};
    Component.defaultProps.allowFontScaling = false;
};

applyDefaultProps(ReactNative.Text);

export type TextProps = ReactNative.TextProps & ModsProps<typeof mods>;

const textMods = rnStyleMods({
    bold: { fontWeight: Platform.OS === 'ios' ? '600' : 'bold' },
    fontWeight: (fontWeight: TextStyle['fontWeight']) => ({
        fontWeight: Platform.OS === 'android' && Number(fontWeight) > 600 ? 'bold' : fontWeight,
    }),
    tabular: { fontVariant: ['tabular-nums'] },
    opacity: (opacity: TextStyle['opacity']) => ({ opacity }),
    fontSize: (fontSize: TextStyle['fontSize']) => ({ fontSize }),
    lineHeight: (lineHeight: TextStyle['lineHeight']) => ({ lineHeight }),
    textAlign: (textAlign: TextStyle['textAlign']) => ({ textAlign }),
    color: (color: TextStyle['color']) => ({ color }),
    center: { textAlign: 'center' },
    strike: {
        textDecorationLine: 'line-through',
        textDecorationStyle: 'solid',
    },
    level: (level: 1 | 2 | 3 | 4) => levels[level],
});

const levels: Record<number, TextStyle> = {
    [1]: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: StyleGuide.spacing(),
    },
    [2]: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: StyleGuide.spacing(0.5),
    },
    [3]: {
        fontSize: 26,
        marginBottom: StyleGuide.spacing(0.5),
    },
    [4]: {
        fontSize: 22,
        marginBottom: StyleGuide.spacing(0.5),
    },
};

const mods = { ...textMods, ...spacingMods };

export const Text = withRnStyleMods(mods)(({ style, ...rest }: ReactNative.TextProps) => {
    return <ReactNative.Text {...rest} lineBreakMode='tail' style={styleCompose(styles.textCommon, style)} />;
});

const styles = ReactNative.StyleSheet.create({
    textCommon: {
        fontWeight: '400',
        lineHeight: undefined,
        color: '#000',
        fontSize: 18,
    },
});
