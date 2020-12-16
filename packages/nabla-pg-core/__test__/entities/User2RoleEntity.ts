import { EntityBase } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';

export type User2RoleEntity = EntityBase<{ userId: string; roleName: string }>;

export const User2Roles = new EntityAccessor<User2RoleEntity>('User2Role');
