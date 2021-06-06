export type TranslateService = {
    translate: (text: string) => Promise<{
        text: string;
        translations: string[];
        examples: Array<{ text: string; translation: string }>;
    }>;
};
