import React, { VFC } from 'react';
import { AxiosProvider, AxiosProviderProps } from '@flstk/use-api';
import { GqlClientProvider } from '@flstk/pg-react/GqlProvider';

const config: AxiosProviderProps = {
    config: {
        baseURL: 'http://localhost:3000/api',
    },
};

export const App: VFC = () => {
    return (
        <AxiosProvider {...config}>
            <GqlClientProvider path='/graphql'>
                <ExampleComponent />
            </GqlClientProvider>
        </AxiosProvider>
    );
};

const ExampleComponent: VFC = () => {
    useEntityAccessor
}