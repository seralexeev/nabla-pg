import { ConfigWrapper } from '@flstk/config';
import { AxiosClientFactory } from '@flstk/rest';
import { Config } from '@projects/expat/api/config';
import { TranslateService } from '@projects/expat/api/modules/translate/TranslateService';
import { singleton } from 'tsyringe';

type TranslateResult = {
    jsonrpc: '2.0';
    result: {
        translations: Array<{
            beams: Array<{ postprocessed_sentence: string; num_symbols: number }>;
            quality: 'normal';
        }>;
        target_lang: 'EN' | 'EN';
        source_lang: 'EN' | 'EN';
        source_lang_is_confident: boolean;
        detectedLanguages: {};
        timestamp: number;
        date: string;
    };
};

@singleton()
export class DeeplTranslateService implements TranslateService {
    private axios;

    constructor(axiosFactory: AxiosClientFactory, { config }: ConfigWrapper<Config>) {
        this.axios = axiosFactory.create('DeeplTranslateService', {
            baseURL: config.deepl.url,
            headers: {
                'user-agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            },
        });
    }

    public translate = async (text: string) => {
        const result = await this.axios.request<TranslateResult>({
            method: 'POST',
            params: { method: 'LMT_handle_jobs' },
            data: {
                jsonrpc: '2.0',
                method: 'LMT_handle_jobs',
                params: {
                    jobs: [
                        {
                            kind: 'default',
                            raw_en_sentence: text,
                            raw_en_context_before: [],
                            raw_en_context_after: [],
                            preferred_num_beams: 4,
                        },
                    ],
                    lang: { user_preferred_langs: ['EN', 'RU'], source_lang_computed: 'EN', target_lang: 'RU' },
                    priority: 1,
                    commonJobParams: { regionalVariant: 'en-US' },
                    timestamp: new Date().getTime(),
                },
            },
        });

        return {
            text,
            translations: result.result.translations[0]?.beams.map((x) => x.postprocessed_sentence) ?? [],
            examples: [],
        };
    };
}
