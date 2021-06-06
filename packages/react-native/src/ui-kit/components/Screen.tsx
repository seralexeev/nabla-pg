import { View, ViewProps } from '@flstk/react-native/ui-kit/components/View';
import React, { FC } from 'react';

export type ScreenProps = ViewProps & {};

export const Screen: FC<ScreenProps> = (props) => {
    return <View {...props} />;
};
