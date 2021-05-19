/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase, DefaultValue, EntityConnection, IdPkey } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';
import type { UserDeviceEntity } from '@projects/expat/shared/entities/generated/UserDeviceEntity';

export type UserEntity = EntityBase<IdPkey> & {
    name: string | null;
    email: string | null;
    updatedAt: DefaultValue<Date>;
    createdAt: DefaultValue<Date>;
    userDevicesConnection: EntityConnection<UserDeviceEntity>;
    userDevices: UserDeviceEntity[];
}

export const Users = new EntityAccessor<UserEntity>('User');
