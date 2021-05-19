import { ConfigWrapper } from '@flstk/config/loader';
import { BootstrapperConfig } from '@flstk/rest/config';
import { ApiError, BadRequest, InternalError } from '@flstk/rest/errors';
import { AppLogger } from '@flstk/rest/logger';
import { ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import PrettyError from 'pretty-error';
import {
    Action,
    ExpressErrorMiddlewareInterface,
    Interceptor,
    InterceptorInterface,
    Middleware
} from 'routing-controllers';
import { serializeError } from 'serialize-error';
import { singleton } from 'tsyringe';

const okResult = { ok: true } as const;

@singleton()
@Interceptor()
@Middleware({ type: 'after' })
export class ResultInterceptor implements InterceptorInterface, ExpressErrorMiddlewareInterface {
    private pe = new PrettyError();
    private config;
    public constructor(private logger: AppLogger, { config }: ConfigWrapper<BootstrapperConfig>) {
        this.config = config;
    }

    public intercept(action: Action, content: unknown) {
        content = content || okResult;
        if (this.config.logging.logResponses) {
            const req: Request = action.request;
            const res: Response = action.response;
            this.logger.info(req.headers, '[headers]');

            let log = `[${req.method} ${res.statusCode}] ${req.url} ${new Date().getTime() - res.locals.start}ms`;
            if (this.config.logging.logResponses === 'full') {
                log += `\n${JSON.stringify(req.body, null, 2)} -> ${JSON.stringify(content, null, 2)}`;
            }

            this.logger.info(log);
        }

        return content;
    }

    public error(error: any, req: Request, res: Response, _: NextFunction) {
        if (['ParamNormalizationError', 'ParamRequiredError'].includes(error.name)) {
            error = new BadRequest('Validation error', { error });
        } else {
            const validationsErrors = Object.values((error as any)?.errors || []).filter(
                (e) => e instanceof ValidationError,
            ) as ValidationError[];

            if (validationsErrors.length) {
                error = new BadRequest('Validation error', {
                    error,
                    payload: validationsErrors.map((x) => Object.values(x.constraints || []).join(',')).join('. '),
                });
            }
        }

        if (!(error instanceof ApiError)) {
            error = new InternalError('Internal error', { error });
        }

        this.sendError(error, req, res);
    }

    private sendError = (error: ApiError, req: Request, res: Response) => {
        const result = this.logAndMapError(error, req, res);
        return res.status(error.statusCode).send(result);
    };

    private logAndMapError = (error: ApiError, req: Request, res: Response) => {
        this.logger.error({
            url: req.url,
            error: serializeError(error),
            build: this.config.build,
            reqId: res.locals.reqId,
            userId: res.locals.user?.id,
            statusCode: error.statusCode,
        });

        if (this.config.logging.prettyPrint) {
            if (error) {
                this.logger.debug(this.pe.render(error));
            }
        }

        return error.toResultError(false);
    };
}
