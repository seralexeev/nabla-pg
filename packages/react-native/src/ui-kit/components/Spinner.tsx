import { mods } from '@flstk/react-native/ui-kit/mods/viewMods';
import { withReactNativeStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

export type SpinnerProps = {
    size?: number | 'small' | 'large';
    color?: string;
};

export const Spinner = withReactNativeStyleMods(mods)(({ style, size = 'small', ...rest }: ActivityIndicatorProps) => {
    return <ActivityIndicator size={size} style={style} {...rest} />;
});
