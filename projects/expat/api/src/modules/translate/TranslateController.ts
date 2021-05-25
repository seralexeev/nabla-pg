import { ApiController, Controller, ServerApi } from '@flstk/rest';
import { YandexTranslateService } from '@projects/expat/api/modules/translate/YandexTranslateService';
import { Body } from 'routing-controllers';

@ApiController()
export class TranslateController implements Controller<TranslateController> {
    public constructor(private yandex: YandexTranslateService) {}

    public async ['POST /translate'](@Body() body: { text: string }) {
        return {
            translation: {
                yandex: await this.yandex.translate(body.text),
            },
        };
    }
}

export type TranslateApi = ServerApi<TranslateController>;
