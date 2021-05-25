import { AxiosProvider } from '@flstk/use-api';
import { TranslateScreen } from '@projects/expat/app/modules/translate/TranslateScreen';
import React from 'react';

const config = { baseURL: 'http://localhost:3000/api' };

export const App = () => {
    return (
        <AxiosProvider config={config}>
            <TranslateScreen />
        </AxiosProvider>
    );
};
