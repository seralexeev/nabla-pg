import { uikit } from '@flstk/react-native';
import { useTranslateApi } from '@projects/expat/app/modules/translate/api';
import React, { useState, VFC } from 'react';
import { Text } from 'react-native';

export const TranslateScreen: VFC = () => {
    const [text, setText] = useState('');

    return (
        <uikit.View paddingVertical={100} padding>
            <uikit.Text level={1}>Enter text</uikit.Text>
            <uikit.TextInput onChangeText={setText} value={text} autoFocus />
            <TranslateResult text={text} />
        </uikit.View>
    );
};

const TranslateResult: VFC<{ text: string }> = ({ text }) => {
    const [translation, { refetching, loading, error }] = useTranslateApi('POST /translate').fetch({
        args: [text],
        skip: !text,
    });

    if (refetching || loading) {
        return <uikit.Spinner />;
    }

    if (error) {
        return <Text>{JSON.stringify(error)}</Text>;
    }

    return <Text>{translation?.translation.yandex}</Text>;
};
