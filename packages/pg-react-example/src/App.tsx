import { GqlClientProvider } from '@flstk/pg-react';
import { AxiosProvider, AxiosProviderProps } from '@flstk/use-api';
import React, { VFC } from 'react';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import { AntdExample } from './AntdExample';
import { EntityAccessorExample } from './EntityAccessorExample';

const config: AxiosProviderProps = {
    config: {
        baseURL: 'http://localhost:3000/api',
    },
};

export const App: VFC = () => {
    return (
        <AxiosProvider {...config}>
            <GqlClientProvider path='/graphql'>
                <BrowserRouter>
                    <div>
                        <nav>
                            <ul>
                                <li>
                                    <Link to='/'>Home</Link>
                                </li>
                                <li>
                                    <Link to='/about'>EntityAccessor</Link>
                                </li>
                                <li>
                                    <Link to='/users'>Antd</Link>
                                </li>
                            </ul>
                        </nav>

                        <Switch>
                            <Route path='/about'>
                                <EntityAccessorExample />
                            </Route>
                            <Route path='/users'>
                                <AntdExample />
                            </Route>
                            <Route path='/'></Route>
                        </Switch>
                    </div>
                </BrowserRouter>
            </GqlClientProvider>
        </AxiosProvider>
    );
};
