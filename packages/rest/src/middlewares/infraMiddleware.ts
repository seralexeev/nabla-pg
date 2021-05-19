import { ConfigWrapper } from '@flstk/config/loader';
import { BootstrapperConfig } from '@flstk/rest/config';
import { Express, RequestHandler } from 'express';
import promBundle from 'express-prom-bundle';
import { DependencyContainer } from 'tsyringe';

export const infraMiddleware = (app: Express, container: DependencyContainer) => {
    const { config } = container.resolve<ConfigWrapper<BootstrapperConfig>>(ConfigWrapper);

    if (config.development.useThrottle) {
        const throttle: RequestHandler = (_, __, next) => {
            setTimeout(next, 2000);
        };

        app.use(throttle);
    }

    const locals: RequestHandler = (req, res, next) => {
        res.locals.reqId = req.headers['x-request-id']?.toString();
        res.locals.start = new Date().getTime();
        next();
    };

    app.use(locals);

    const prom = promBundle({
        includeMethod: true,
        includePath: true,
        metricsPath: '/metrics',
        customLabels: config.build,
        normalizePath: (req) => req.route?.path ?? req.path,
    });

    app.use(prom);
};
