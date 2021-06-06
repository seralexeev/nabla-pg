import { ApiController, Controller, ServerApi } from '@flstk/rest';
import { ReversoTranslateService } from '@projects/expat/api/modules/translate/ReversoTranslateService';
import { YandexTranslateService } from '@projects/expat/api/modules/translate/YandexTranslateService';
import { Body } from 'routing-controllers';

@ApiController()
export class TranslateController implements Controller<TranslateController> {
    public constructor(
        private yandex: YandexTranslateService,
        private reverso: ReversoTranslateService
    ) {}

    public async ['POST /translate'](@Body() body: { text: string }) {
        const [yandex, reverso] = await Promise.allSettled([
            this.yandex.translate(body.text),
            this.reverso.translate(body.text),
        ]);

        return {
            translation: {
                yandex: yandex.status === 'fulfilled' ? yandex.value : null,
                reverso: reverso.status === 'fulfilled' ? reverso.value : null,
            },
        };
    }
}

export type TranslateApi = ServerApi<TranslateController>;
