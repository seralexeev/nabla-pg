import { ensureReactElement } from '@flstk/react-core';
import { Text } from '@flstk/react-native/ui-kit/components/Text';
import { View, ViewProps } from '@flstk/react-native/ui-kit/components/View';
import * as icons from '@flstk/react-native/ui-kit/icons';
import React, { FC, ReactNode, VFC } from 'react';
import { ColorValue } from 'react-native';

export type ScreenProps = ViewProps & {
    header: ReactNode;
};

export const Screen: FC<ScreenProps> = (props) => {
    const { edges = ['top', 'bottom'], header, backgroundColor, children, ...rest } = props;
    
    const screenHeader = (
        <ScreenHeader backgroundColor={backgroundColor} left={<BackButton />}>
            {header}
        </ScreenHeader>
    );

    return (
        <View {...rest} edges={edges} backgroundColor={backgroundColor} flex>
            {screenHeader}
            {children}
        </View>
    );
};

type ScreenHeaderProps = {
    backgroundColor?: ColorValue;
    left?: ReactNode;
    right?: ReactNode;
    children?: ReactNode;
};

export const ScreenHeader: FC<ScreenHeaderProps> = ({ children, left, right, backgroundColor }) => {
    return (
        <View row backgroundColor={backgroundColor} height={50}>
            <View minWidth={54}>{left}</View>
            {ensureReactElement(children, (x) => (
                <View center flex>
                    <Text children={x} center lineBreakMode='tail' numberOfLines={1} />
                </View>
            ))}
            <View minWidth={54}>{right}</View>
        </View>
    );
};

export const BackButton = () => {
    return (
        <View padding={15} center>
            <icons.ChevronLeft width={20} height={20} fill='#000' />
        </View>
    );
};
