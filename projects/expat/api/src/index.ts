import 'reflect-metadata';

import { bootstrap } from '@flstk/rest';
import { defaultConfig } from '@projects/expat/api/config/default';
import { dev } from '@projects/expat/api/config/dev';
import { prod } from '@projects/expat/api/config/prod';
import { UserController } from '@projects/expat/api/modules/user/UserController';
import { UserService } from '@projects/expat/api/modules/user/UserService';
import { TranslateController } from '@projects/expat/api/modules/translate/TranslateController';

const { express, logger, config } = bootstrap({
    config: {
        prefix: 'EXPT',
        environments: ['dev', 'prod'],
        defaultConfig,
        envConfigs: { dev, prod },
    },
});

express({
    controllers: [UserController, TranslateController],
    UserService,
}).listen(config.port, () => logger.info(`Server started on port ${config.port}`));
