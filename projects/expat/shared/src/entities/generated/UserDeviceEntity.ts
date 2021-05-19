/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase, DefaultValue, IdPkey } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';
import type { UserEntity } from '@projects/expat/shared/entities/generated/UserEntity';

export type UserDeviceEntity = EntityBase<IdPkey> & {
    userId: string;
    fcmToken: string | null;
    pushAuthorizationStatus: string | null;
    refreshToken: string | null;
    deviceInfo: any | null;
    updatedAt: DefaultValue<Date>;
    createdAt: DefaultValue<Date>;
    user: UserEntity;
}

export const UserDevices = new EntityAccessor<UserDeviceEntity>('UserDevice');
