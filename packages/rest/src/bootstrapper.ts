import { ConfigLoader, ConfigWrapper } from '@flstk/config';
import { createDefaultPg, Pg } from '@flstk/pg';
import { BootstrapperConfig, bootstrapperConfig } from '@flstk/rest/config';
import { Container } from '@flstk/rest/container';
import { useControllers } from '@flstk/rest/controllers';
import { AppLogger } from '@flstk/rest/logger';
import { authMiddleware } from '@flstk/rest/middlewares/authMiddleware';
import { deviceMiddleware } from '@flstk/rest/middlewares/deviceMiddleware';
import { infraMiddleware } from '@flstk/rest/middlewares/infraMiddleware';
import { UserService } from '@flstk/rest/services/UserService';
import { usePostgraphile } from '@flstk/rest/usePostgraphile';
import { Class, pick } from '@flstk/utils';
import cookieParse from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { Pool } from 'pg';
import promClient from 'prom-client';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { container as tsyringeContainer } from 'tsyringe';

export const bootstrap = (args: { configWrapper: ConfigWrapper<BootstrapperConfig> }) => {
    const { config } = args.configWrapper;

    const pool = new Pool(pick(config.pg, ['database', 'host', 'port', 'user', 'password']));
    const pg = createDefaultPg(pool as any);
    const logger = new AppLogger(config);
    const container = tsyringeContainer.createChildContainer();

    container
        .register(AppLogger, { useValue: logger })
        .register(Pg, { useValue: pg })
        .register(ConfigWrapper, { useValue: args.configWrapper })
        .register(Container, { useValue: new Container(container) });

    return {
        container,
        logger,
        config,
        express: (expressConfig: { UserService: Class<UserService>; controllers: Function[] }) => {
            promClient.collectDefaultMetrics();
            routingUseContainer({ get: (x) => container.resolve(x) }, { fallback: false, fallbackOnErrors: false });

            const app = express().disable('x-powered-by').disable('etag');

            infraMiddleware(app, container);

            app.use(
                cors({
                    origin: (_, allow) => allow(null, true),
                    credentials: true,
                    preflightContinue: true,
                }),
            );

            app.use(express.json());
            app.use(cookieParse());
            app.use(authMiddleware({ container, userService: container.resolve(expressConfig.UserService) }));
            app.use(deviceMiddleware(container));

            usePostgraphile(app, container);
            useControllers(app, {
                container,
                controllers: expressConfig.controllers,
            });

            return app;
        },
    };
};
