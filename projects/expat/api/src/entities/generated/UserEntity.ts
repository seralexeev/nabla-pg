/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase, DefaultValue, IdPkey } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';

export type UserEntity = EntityBase<IdPkey> & {
    name: string | null;
    email: string | null;
    updatedAt: DefaultValue<Date>;
    createdAt: DefaultValue<Date>;
}

export const Users = new EntityAccessor<UserEntity>('User');
