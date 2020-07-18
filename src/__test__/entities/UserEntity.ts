import { EntityBase, IdPkey, ReadonlyValue } from '../../db/entity';
import { EntityAccessor } from '../../db/EntityAccessor';
import { RoleEntity } from './RoleEntity';
import { OrderEntity } from './OrderEntity';

export type UserEntity = EntityBase<'User', IdPkey> & {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;

    rolesList: RoleEntity[];
    orders: OrderEntity[];
};

export const Users = new EntityAccessor<UserEntity>('User');
