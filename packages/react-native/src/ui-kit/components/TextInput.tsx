import { mods } from '@flstk/react-native/ui-kit/mods/viewMods';
import { styleCompose, withReactNativeStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import * as rn from 'react-native';

export const TextInput = withReactNativeStyleMods(mods)(({ style, ...rest }: rn.TextInputProps) => {
    return <rn.TextInput {...rest} style={styleCompose(styles.input, style)} />;
});

const styles = rn.StyleSheet.create({
    input: {
        height: 36,
        backgroundColor: '#fff',
        fontSize: 18
    },
});
