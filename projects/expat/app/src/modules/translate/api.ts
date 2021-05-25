import { createApiClient } from '@flstk/use-api';
import type { TranslateApi } from '@projects/expat/api/modules/translate/TranslateController';

export const useTranslateApi = createApiClient<TranslateApi>()({
    'POST /translate': ({ post }) => {
        return (text: string) => post('/translate', { text });
    },
});
