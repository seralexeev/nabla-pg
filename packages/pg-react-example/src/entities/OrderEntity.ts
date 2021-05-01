/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase, DefaultValue, IdPkey } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';
import type { UserEntity } from './UserEntity';

export type OrderEntity = EntityBase<IdPkey> & {
    userId: string;
    comment: string | null;
    user: UserEntity;
};

export const Orders = new EntityAccessor<OrderEntity>('Order');
