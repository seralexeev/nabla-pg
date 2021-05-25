import { ConfigWrapper } from '@flstk/config';
import { AxiosClientFactory } from '@flstk/rest';
import { Config } from '@projects/expat/api/config';
import { TranslateService } from '@projects/expat/api/modules/translate/TranslateService';
import { singleton } from 'tsyringe';

type TranslateResult = {
    translations: Array<{ text: string; detectedLanguageCode: string }>;
};

@singleton()
export class YandexTranslateService implements TranslateService {
    private axios;
    private config;

    constructor(axiosFactory: AxiosClientFactory, { config }: ConfigWrapper<Config>) {
        this.config = config;
        this.axios = axiosFactory.create('YandexTranslateService', {
            baseURL: config.yandex.translate.url,
            headers: {
                Authorization: `Bearer ${config.yandex.iamToken}`,
            },
        });
    }

    public translate = async (text: string) => {
        const result = await this.axios.request<TranslateResult>({
            method: 'POST',
            data: {
                folder_id: this.config.yandex.folderId,
                texts: [text],
                targetLanguageCode: 'ru',
            },
        });

        return result.translations[0].text;
    };
}
