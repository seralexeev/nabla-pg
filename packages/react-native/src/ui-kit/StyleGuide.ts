import { Platform } from 'react-native';
import { Dimensions } from 'react-native';

const { width, height, fontScale, scale } = Dimensions.get('window');

export const Layout = {
    window: width,
    height,
    fontScale,
    scale,
    isSmallDevice: width < 375,
} as const;

const spacing = Layout.isSmallDevice ? 16 : 18;

export const StyleGuide = {
    borderRadius: 16,
    boxShadow: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 0.13,
            shadowRadius: 10,
        },
        android: {
            elevation: 3,
        },
    }),

    spacing: (x: number = 1) => spacing * x,
    flex: { flex: 1 },
} as const;
