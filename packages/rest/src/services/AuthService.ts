import { ConfigWrapper } from '@flstk/config';
import { Pg, Transaction } from '@flstk/pg';
import { BootstrapperConfig } from '@flstk/rest/config';
import { DeviceInfo } from '@flstk/rest/entities/DeviceInfo';
import { UserDevices } from '@flstk/rest/entities/UserDeviceEntity';
import { Unauthorized } from '@flstk/rest/errors';
import { AppLogger } from '@flstk/rest/logger';
import jwt from 'jsonwebtoken';
import { singleton } from 'tsyringe';

@singleton()
export class AuthService {
    private config;
    public constructor(private logger: AppLogger, private pg: Pg, { config }: ConfigWrapper<BootstrapperConfig>) {
        this.config = config;
    }

    public async logout(userId: string, deviceId: string) {
        const device = await UserDevices.findOne(this.pg, {
            filter: { id: { equalTo: deviceId }, userId: { equalTo: userId } },
            selector: ['id'],
        });

        if (!device) {
            this.logger.warn('Unable to handle logout because unable to find device');
        } else {
            await UserDevices.delete(this.pg, { pk: { id: deviceId } });
        }
    }

    public async renewTokens(args: { refreshToken: string; deviceInfo?: DeviceInfo }) {
        return this.pg.transaction(async (t) => {
            const decoded = this.validateRefreshToken(args.refreshToken);
            const userId = decoded.sub;
            const device = await UserDevices.findByPk(t, {
                pk: { id: decoded.deviceId },
                selector: ['refreshToken', 'deviceInfo'],
            });

            if (!device || device.refreshToken !== args.refreshToken) {
                await this.logout(userId, decoded.deviceId);
                throw new Unauthorized('Invalid token', {
                    internal: { message: 'Invalid refresh token' },
                });
            }

            const deviceInfo = args.deviceInfo ?? device.deviceInfo;

            return this.generateTokens(userId, deviceInfo);
        });
    }

    private generateTokens(userId: string, deviceInfo: DeviceInfo) {
        this.generateTokensImpl(this.pg, userId, deviceInfo);
    }

    private generateTokensImpl = (t: Transaction, userId: string, deviceInfo: DeviceInfo) => {
        const deviceId = deviceInfo.deviceId;
        const accessToken = this.generateAccessToken(userId);
        const refreshToken = this.generateRefreshToken(deviceId, userId);

        const item = { userId, refreshToken, deviceInfo };

        return UserDevices.updateOrCreate(t, {
            pk: { id: deviceId },
            selector: ['updatedAt'],
            item,
        }).then(() => ({ accessToken, refreshToken }));
    };

    public revokeDevice(args: { deviceId: string }) {
        return UserDevices.delete(this.pg, {
            pk: { id: args.deviceId },
        });
    }

    private generateAccessToken = (userId: string) => {
        return jwt.sign({ sub: userId }, this.config.auth.jwt.secret, {
            expiresIn: this.config.auth.jwt.accessExpiresIn,
            issuer: this.config.auth.jwt.issuer,
        });
    };

    private generateRefreshToken = (deviceId: string, userId: string) => {
        return jwt.sign({ sub: userId, deviceId }, this.config.auth.jwt.secret, {
            expiresIn: this.config.auth.jwt.refreshExpiresIn,
            issuer: this.config.auth.jwt.issuer,
        });
    };

    public validateAccessToken = (accessToken: string) => {
        try {
            jwt.verify(accessToken, this.config.auth.jwt.secret, { issuer: this.config.auth.jwt.issuer });
            return jwt.decode(accessToken, { json: true }) as AccessTokenPayload;
        } catch (error) {
            throw new Unauthorized('Invalid token', {
                internal: { message: 'AccessToken invalid or expired: ' + error.message },
                error,
            });
        }
    };

    private validateRefreshToken = (refreshToken: string) => {
        try {
            jwt.verify(refreshToken, this.config.auth.jwt.secret, { issuer: this.config.auth.jwt.issuer });
            return jwt.decode(refreshToken, { json: true }) as RefreshTokenPayload;
        } catch (error) {
            throw new Unauthorized('Invalid token', {
                internal: { message: 'RefreshToken invalid or expired: ' + error.message },
                error,
            });
        }
    };
}

export type AccessTokenPayload = {
    sub: string;
};

export type RefreshTokenPayload = {
    sub: string;
    deviceId: string;
};
