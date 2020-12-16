import { EntityBase } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';
import { UserEntity } from './UserEntity';

export const permissions = ['*', 'orders.view', 'orders.create', 'payment.confirm'] as const;
export type Permission = typeof permissions[number];

export type RoleEntity = EntityBase<{ name: string }> & {
    permissions: Permission[];
    usersList: UserEntity[];
};

export const Roles = new EntityAccessor<RoleEntity>('Role', {
    pkDef: { name: 'String!' },
});
