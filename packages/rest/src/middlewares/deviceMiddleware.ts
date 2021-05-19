import { DeviceInfo } from '@flstk/rest/entities/DeviceInfo';
import { AppLogger } from '@flstk/rest/logger';
import { RequestHandler } from 'express';
import { DependencyContainer } from 'tsyringe';

export const collectDeviceInfo = (
    headers: Record<string, string | string[] | undefined> | undefined,
    logger: AppLogger,
): DeviceInfo | null => {
    try {
        if (!headers || !headers['x-device-info']) {
            return null;
        }

        return JSON.parse(headers['x-device-info'].toString());
    } catch {
        logger.warn('x-device-info is missing');
        return null;
    }
};

export const deviceMiddleware = (container: DependencyContainer): RequestHandler => {
    const logger = container.resolve(AppLogger);

    return (req, res, next) => {
        const di = collectDeviceInfo(req.headers, logger);
        if (di) {
            res.locals.deviceInfo = di;
        } else if (req.method !== 'OPTIONS') {
            logger.warn('x-device-info is missing');
        }

        next();
    };
};
