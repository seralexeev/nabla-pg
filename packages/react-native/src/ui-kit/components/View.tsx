import { ModsProps } from '@flstk/react-core';
import { mods } from '@flstk/react-native/ui-kit/mods/viewMods';
import { withRnStyleMods } from '@flstk/react-native/utils';
import React from 'react';
import { SafeAreaView, NativeSafeAreaViewProps } from 'react-native-safe-area-context';
import { View as RnView } from 'react-native';

export type ViewProps = NativeSafeAreaViewProps & ModsProps<typeof mods>;

export const View = withRnStyleMods(mods)(({ style, edges, ...rest }: ViewProps) => {
    return edges && edges.length ? (
        <SafeAreaView style={style} edges={edges ?? ['left']} {...rest} />
    ) : (
        <RnView style={style} {...rest} />
    );
});
