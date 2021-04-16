import { DefaultValue, EntityAccessor, EntityBase, IdPkey, ReadonlyValue } from '../../src';
import { OrderEntity } from './OrderEntity';
import { RoleEntity } from './RoleEntity';

const genders = ['male', 'female'] as const;
export type Gender = typeof genders[number];

export type UserEntity = EntityBase<IdPkey> & {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;

    gender: string | null;
    rolesList: RoleEntity[];
    orders: OrderEntity[];
    mainOrder: OrderEntity | null;

    roles: DefaultValue<string[]>;
};

export const Users = new EntityAccessor<UserEntity>('User');
