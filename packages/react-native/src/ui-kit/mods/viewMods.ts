import { spacingMods } from '@flstk/react-native/ui-kit/mods/spacingMods';
import { StyleGuide } from '@flstk/react-native/ui-kit/StyleGuide';
import { rnStyleMods } from '@flstk/react-native/utils';
import { StyleSheet, ViewStyle } from 'react-native';

export const viewMods = rnStyleMods({
    fillContainer: StyleSheet.absoluteFillObject,
    flex: (flex: number = 1) => ({ flex }),
    flexGrow: (flexGrow: number = 1) => ({ flexGrow }),
    flexShrink: (flexShrink: number = 1) => ({ flexShrink }),
    row: { flexDirection: 'row' },
    justifyContent: (justifyContent: ViewStyle['justifyContent']) => ({ justifyContent }),
    alignItems: (alignItems: ViewStyle['alignItems']) => ({ alignItems }),
    fullHeight: { height: '100%' },
    overflow: (overflow: ViewStyle['overflow']) => ({ overflow }),
    height: (height: ViewStyle['height']) => ({ height }),
    width: (width: ViewStyle['width']) => ({ width }),
    size: (size: ViewStyle['width']) => ({ width: size, height: size }),
    backgroundColor: (backgroundColor: ViewStyle['backgroundColor']) => ({ backgroundColor }),
    center: { justifyContent: 'center', alignItems: 'center' },
    minWidth: (minWidth: ViewStyle['minWidth']) => ({ minWidth }),
    minHeight: (minHeight: ViewStyle['minHeight']) => ({ minHeight }),
    maxHeight: (maxHeight: ViewStyle['maxHeight']) => ({ maxHeight }),
    maxWidth: (maxWidth: ViewStyle['maxWidth']) => ({ maxWidth }),
    borderRadius: (borderRadius: ViewStyle['borderRadius'] = StyleGuide.borderRadius) => ({ borderRadius }),
    shadow: { ...StyleGuide.boxShadow },
    zIndex: (zIndex: number) => ({ zIndex }),
    opacity: (opacity: number) => ({ opacity }),

    border: ([borderWidth, borderColor]: [borderWidth: ViewStyle['borderWidth'], borderColor: ViewStyle['borderColor']]) => ({
        borderWidth,
        borderColor,
    }),
});

export const mods = { ...viewMods, ...spacingMods };
