import { ui } from '@projects/expat/app/ui-kit';
import React, { VFC } from 'react';

type SignInScreenProps = {};

export const SignInScreen: VFC<SignInScreenProps> = (props) => {
    return (
        <ui.Screen header='Sign in'>
            <ui.Button onPress={console.log}>Sign in</ui.Button>
        </ui.Screen>
    );
};
