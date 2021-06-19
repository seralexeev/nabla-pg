import { mods } from '@flstk/react-native/mods/viewMods';
import { styleCompose, withRnStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import * as rn from 'react-native';

export type InputProps = rn.TextInputProps;

export const TextInput = withRnStyleMods(mods)(({ style, ...rest }: InputProps) => {
    return <rn.TextInput {...rest} style={styleCompose(styles.input, style)} />;
});

const styles = rn.StyleSheet.create({
    input: {
        height: 36,
        backgroundColor: '#fff',
        fontSize: 18
    },
});
