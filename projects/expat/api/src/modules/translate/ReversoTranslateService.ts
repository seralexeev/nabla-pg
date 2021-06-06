import { TranslateService } from '@projects/expat/api/modules/translate/TranslateService';
import Reverso from 'reverso-api';

type TranslateResult = {
    text: string;
    from: string;
    to: string;
    translations: string[];
    examples: Array<{ id: number; from: string; to: string }>;
};

export class ReversoTranslateService implements TranslateService {
    private reverso;

    public constructor() {
        this.reverso = new Reverso();
    }

    public translate = async (text: string) => {
        const result: TranslateResult = await this.reverso.getContext(text, 'English', 'Russian');
        return {
            text,
            translations: result.translations,
            examples: result.examples.map((x) => ({
                text: x.from,
                translation: x.to,
            })),
        };
    };
}
