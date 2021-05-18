import { pick } from '@flstk/utils';
import React from 'react';
import { Text } from 'react-native';

export const App = () => {
    return <Text>{JSON.stringify(pick({ a: 1 }, ['a']))}</Text>;
};
