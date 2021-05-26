import { ModsProps } from '@flstk/react-core';
import { mods } from '@flstk/react-native/ui-kit/mods/viewMods';
import { withReactNativeStyleMods } from '@flstk/react-native/utils';
import { View as ReactNativeView, ViewProps as ReactNativeViewProps } from 'react-native';

export type ViewProps = ReactNativeViewProps & ModsProps<typeof mods>;

export const View = withReactNativeStyleMods(mods)(ReactNativeView);
