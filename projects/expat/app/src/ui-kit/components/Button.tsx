import { ensureReactElement } from '@flstk/react-core';
import { StyleGuide, uikit, viewMods, withRnStyleMods } from '@flstk/react-native';
import React, { FC } from 'react';
import { Pressable, PressableProps, PressableStateCallbackType, StyleSheet, ViewStyle } from 'react-native';

export type ButtonProps = PressableProps & {
    style: ViewStyle;
};

const ButtonImpl: FC<ButtonProps> = ({ children, style, ...rest }) => {
    const styleCallback =
        typeof style === 'function'
            ? style
            : ({ pressed }: PressableStateCallbackType) => {
                  return pressed ? [styles.pressed, styles.wrapper, style] : [styles.wrapper, style];
              };

    return (
        <Pressable {...rest} style={styleCallback}>
            {ensureReactElement(children, (x) => (
                <uikit.Text children={x} color='#fff' bold fontSize={16} />
            ))}
        </Pressable>
    );
};

export const Button = withRnStyleMods(viewMods)(ButtonImpl);

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 24,
        padding: StyleGuide.spacing(0.5),
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.6,
    },
});
