import { ConfigWrapper } from '@flstk/config';
import { BootstrapperConfig } from '@flstk/rest/config';
import { Unauthorized } from '@flstk/rest/errors';
import { ResultInterceptor } from '@flstk/rest/middlewares/ResultInterceptor';
import { PermissionsOptions, validatePermissions } from '@flstk/rest/security';
import { Express, Response } from 'express';
import { Action, Authorized, Controller, Get, Post, useExpressServer } from 'routing-controllers';
import { DependencyContainer, singleton } from 'tsyringe';

// permanently disable class-transformer for serialization
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('class-transformer')['classToPlain'] = function (obj: Record<string, unknown>) {
    return obj;
};

export const useControllers = (app: Express, options: { container: DependencyContainer; controllers: Function[] }) => {
    const { controllers, container } = options;
    const { config } = container.resolve<ConfigWrapper<BootstrapperConfig>>(ConfigWrapper);

    useExpressServer(app, {
        routePrefix: config.apiEndpoint,
        controllers,
        validation: true,
        classTransformer: true,
        interceptors: [ResultInterceptor],
        middlewares: [ResultInterceptor],
        defaultErrorHandler: false,
        currentUserChecker: (action: Action) => {
            const response: Response = action.response;
            return response.locals?.user;
        },
        authorizationChecker: async (action: Action, options: PermissionsOptions) => {
            const response: Response = action.response;
            const user = response.locals.user;
            if (!user) {
                throw new Unauthorized(`User required, but wasn't provided`);
            }

            return validatePermissions(user.permissions, options);
        },
    });
};

/**
 *
 * @param permissions
 * PermissionRequired(a, b) --> a OR b
 *
 * PermissionRequired([a,c], b) --> (a AND c) OR b
 */
export const PermissionRequired = (...permissions: PermissionsOptions) => {
    return Authorized(permissions);
};

export const ApiController = (route?: string) => {
    return (target: any) => {
        singleton()(target);
        Controller(route)(target);

        for (const methodName of Object.getOwnPropertyNames(target.prototype)) {
            const [method, path] = methodName.split(' ');
            switch (method) {
                case 'GET': {
                    Get(path)(target.prototype, methodName);
                    break;
                }
                case 'POST': {
                    Post(path)(target.prototype, methodName);
                    break;
                }
            }
        }
    };
};

export type HttpMethod = 'GET' | 'POST';

export type Controller<T> = {
    [K in keyof T]: K extends `${HttpMethod} /${string}` ? (...args: any[]) => any : never;
};
