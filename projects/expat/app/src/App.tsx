import { AxiosProvider } from '@flstk/use-api';
import { TranslateScreen } from '@projects/expat/app/modules/translate/TranslateScreen';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const config = { baseURL: 'http://localhost:3000/api' };

export const App = () => {
    return (
        <SafeAreaProvider>
            <AxiosProvider config={config}>
                <TranslateScreen />
            </AxiosProvider>
        </SafeAreaProvider>
    );
};
