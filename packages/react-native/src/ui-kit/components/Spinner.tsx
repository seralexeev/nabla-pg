import { mods } from '@flstk/react-native/mods/viewMods';
import { withRnStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

export type SpinnerProps = {
    size?: number | 'small' | 'large';
    color?: string;
};

export const Spinner = withRnStyleMods(mods)(({ style, size = 'small', ...rest }: ActivityIndicatorProps) => {
    return <ActivityIndicator size={size} style={style} {...rest} />;
});
