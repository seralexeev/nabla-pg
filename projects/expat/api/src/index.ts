import 'reflect-metadata';

import { ConfigLoader } from '@flstk/config';
import { bootstrap } from '@flstk/rest/bootstrapper';
import { defaultConfig } from '@projects/expat/api/config/default';
import { dev } from '@projects/expat/api/config/dev';
import { prod } from '@projects/expat/api/config/prod';
import { UserController } from '@projects/expat/api/modules/user/UserController';
import { UserService } from '@projects/expat/api/modules/user/UserService';

const { express, logger, config } = bootstrap({
    configWrapper: new ConfigLoader(['dev', 'prod'], defaultConfig, { dev, prod }).load(),
});

express({
    controllers: [UserController],
    UserService,
}).listen(config.port, () => logger.info(`Server started on port ${config.port}`));
