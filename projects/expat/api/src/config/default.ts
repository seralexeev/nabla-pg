import { declare, OverridedConfig } from '@flstk/config';
import { bootstrapperConfig } from '@flstk/rest';
import { merge } from 'lodash';

export const defaultConfig = merge(bootstrapperConfig, {
    pg: {
        user: declare.string('expat'),
        password: declare.string('expat'),
        database: declare.string('expat'),
    },
    yandex: {
        iamToken: declare.string(''),
        folderId: declare.string('b1gaeqnrfb0oevt0kv2m'),
        translate: {
            url: declare.string('https://translate.api.cloud.yandex.net/translate/v2/translate'),
        },
    },
    deepl: {
        url: declare.string('https://www2.deepl.com/jsonrpc'),
    },
});
