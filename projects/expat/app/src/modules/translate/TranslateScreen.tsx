import { uikit, Layout } from '@flstk/react-native';
import { useTranslateApi } from '@projects/expat/app/modules/translate/api';
import React, { Fragment, useCallback, useDebugValue, useState, VFC } from 'react';
import { Text } from 'react-native';
import { useDebounce } from 'use-debounce';

export const TranslateScreen: VFC = () => {
    const [slides, setSlides] = useState([1, 2, 3, 4]);

    const onSnapToItem = useCallback(
        (i: number) => {
            if (slides.length - 2 === i) {
                setSlides((prev) => [...prev, prev[prev.length - 1] + 1]);
            }
        },
        [slides],
    );

    return (
        <uikit.Screen flex backgroundColor='black'>
            <uikit.View paddingHorizontal>
                <uikit.Text level={1} marginBottom>
                    Enter text
                </uikit.Text>
                <uikit.Text>{JSON.stringify(slides)}</uikit.Text>
            </uikit.View>

            <uikit.Carousel
                data={slides}
                sliderWidth={Layout.width}
                itemWidth={Layout.width}
                onSnapToItem={onSnapToItem}
                layout='tinder'
                renderItem={() => (
                    <uikit.View padding borderRadius flex backgroundColor='#fff'>
                        <Translate />
                    </uikit.View>
                )}
            />
        </uikit.Screen>
    );
};

const Translate: VFC = () => {
    const [text, setText] = useState('');
    const [debounced, { flush }] = useDebounce(text, 1000);

    return (
        <uikit.View flex>
            <uikit.TextInput
                onChangeText={setText}
                value={text}
                autoFocus
                border={[1, '#ddd']}
                onSubmitEditing={flush}
                onBlur={flush}
            />
            <uikit.View padding>
                <TranslateResult text={debounced} />
            </uikit.View>
        </uikit.View>
    );
};

const TranslateResult: VFC<{ text: string }> = ({ text }) => {
    const [translation, { refetching, loading, error }] = useTranslateApi('POST /translate').fetch({
        args: [text],
        skip: !text,
    });

    if (!text) {
        return <uikit.Text>...</uikit.Text>;
    }

    if (refetching || loading) {
        return <uikit.Spinner />;
    }

    if (error) {
        return <Text>{JSON.stringify(error)}</Text>;
    }

    return <Text>{JSON.stringify(translation, null, 2)}</Text>;
};
