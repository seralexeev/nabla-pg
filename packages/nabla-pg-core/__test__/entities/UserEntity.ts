import { EntityBase, IdPkey, ReadonlyValue } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';
import { OrderEntity } from './OrderEntity';
import { RoleEntity } from './RoleEntity';

const genders = ['male', 'female'] as const;
export type Gender = typeof genders[number];

export type UserEntity = EntityBase<'User', IdPkey> & {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;

    gender: string | null;
    rolesList: RoleEntity[];
    orders: OrderEntity[];
};

export const Users = new EntityAccessor<UserEntity>('User');
