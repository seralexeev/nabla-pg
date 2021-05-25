import { useTranslateApi } from '@projects/expat/app/modules/translate/api';
import React, { useState, VFC } from 'react';
import { Text, TextInput, View } from 'react-native';

type TranslateScreenProps = {};

export const TranslateScreen: VFC<TranslateScreenProps> = (props) => {
    const [text, setText] = useState('');

    return (
        <View style={{ paddingVertical: 100, paddingHorizontal: 20 }}>
            <TextInput onChangeText={setText} value={text} style={{ borderColor: 'red', borderWidth: 2 }} />
            <TranslateResult text={text} />
        </View>
    );
};

const TranslateResult: VFC<{ text: string }> = ({ text }) => {
    const [translation, { refetching, loading, error }] = useTranslateApi('POST /translate').fetch({
        args: [text],
        skip: !text,
    });

    if (refetching || loading) {
        return <Text>loading...</Text>;
    }

    if (error) {
        return <Text>{JSON.stringify(error)}</Text>;
    }

    return <Text>{translation?.translation.yandex}</Text>;
};
