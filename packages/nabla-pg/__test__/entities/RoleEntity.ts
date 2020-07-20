import { EntityBase } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';
import { UserEntity } from './UserEntity';

export const permissions = ['*', 'orders.view', 'orders.create', 'payment.confirm'] as const;
export type Permission = typeof permissions[number];

export type RoleEntity = EntityBase<'Role', { name: string }> & {
    permissions: Permission[];
    usersList: UserEntity[];
};

class RoleAccessor extends EntityAccessor<RoleEntity> {
    public constructor() {
        super('Role');
    }

    public getPkArg = (pk: { name: string }) => {
        return Object.keys(pk)
            .map((x) => `$${x}: String!`)
            .join(', ');
    };
}

export const Roles = new RoleAccessor();
