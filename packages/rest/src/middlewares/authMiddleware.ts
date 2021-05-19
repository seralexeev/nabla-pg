import { Forbidden } from '@flstk/rest/errors';
import { PermissionsOptions, validatePermissions } from '@flstk/rest/security';
import { AuthService } from '@flstk/rest/services/AuthService';
import { UserService } from '@flstk/rest/services/UserService';
import { isUUID } from '@flstk/utils';
import { Request, RequestHandler } from 'express';
import { DependencyContainer } from 'tsyringe';

const IMPERSONATE_HEADER = 'x-impersonate';

export const authMiddleware = (config: {
    container: DependencyContainer;
    userService: UserService;
}): RequestHandler => {
    const authService = config.container.resolve(AuthService);

    const getUserIdOrReject = (request: Request) => {
        const impersonate = request.headers[IMPERSONATE_HEADER] as string;
        if (impersonate && isUUID(impersonate)) {
            // return impersonate;
        }

        const accessToken = request.headers.authorization?.split(' ')[1] || null;
        if (!accessToken) {
            return null;
        }

        return authService.validateAccessToken(accessToken).sub;
    };

    return async (request, response, next) => {
        try {
            const userId = getUserIdOrReject(request);
            if (!userId) {
                return next();
            }

            const user = await config.userService.getAppUser(userId);
            if (user.bannedAt) {
                throw new Forbidden('User was banned');
            }

            response.locals.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const permissionGuard = (...permissions: PermissionsOptions): RequestHandler => {
    return (_, res, next) => {
        if (!res.locals.user || !validatePermissions(res.locals.user.permissions, permissions)) {
            return next(new Forbidden('No permissions'));
        }

        next();
    };
};
