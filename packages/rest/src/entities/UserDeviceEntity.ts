import { DefaultValue, EntityAccessor, EntityBase, IdPkey } from '@flstk/pg';

export type UserDeviceEntity = EntityBase<IdPkey> & {
    userId: string;
    refreshToken: string | null;
    deviceInfo: any | null;

    createdAt: DefaultValue<Date>;
    updatedAt: DefaultValue<Date>;
};

export const UserDevices = new EntityAccessor<UserDeviceEntity>('UserDevice');
