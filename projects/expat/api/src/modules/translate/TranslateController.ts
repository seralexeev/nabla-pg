import { ApiController, Controller, ServerApi } from '@flstk/rest';
import { DeeplTranslateService } from '@projects/expat/api/modules/translate/DeeplTranslateService';
import { ReversoTranslateService } from '@projects/expat/api/modules/translate/ReversoTranslateService';
import { YandexTranslateService } from '@projects/expat/api/modules/translate/YandexTranslateService';
import { Body } from 'routing-controllers';

@ApiController()
export class TranslateController implements Controller<TranslateController> {
    public constructor(
        private yandex: YandexTranslateService,
        private reverso: ReversoTranslateService,
        private deepl: DeeplTranslateService,
    ) {}

    public async ['POST /translate'](@Body() body: { text: string }) {
        const [yandex, reverso, deepl] = await Promise.allSettled([
            this.yandex.translate(body.text),
            this.reverso.translate(body.text),
            this.deepl.translate(body.text),
        ]);

        [yandex, reverso, deepl].filter((x) => x.status === 'rejected').forEach(x => {
            console.log(x);
        });

        return {
            translation: {
                yandex: yandex.status === 'fulfilled' ? yandex.value : null,
                reverso: reverso.status === 'fulfilled' ? reverso.value : null,
                deepl: deepl.status === 'fulfilled' ? deepl.value : null,
            },
        };
    }
}

export type TranslateApi = ServerApi<TranslateController>;
