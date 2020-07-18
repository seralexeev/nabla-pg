import { EntityBase } from '../../db/entity';
import { EntityAccessor } from '../../db/EntityAccessor';

export type User2RoleEntity = EntityBase<'User2Role', { userId: string; roleName: string }>;

export const User2Roles = new EntityAccessor<User2RoleEntity>('User2Role');
