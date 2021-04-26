/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase, DefaultValue, EntityConnection, IdPkey } from '@flstk/pg';
import { EntityAccessor } from '@flstk/pg';
import type { OrderEntity } from './OrderEntity';

export type UserEntity = EntityBase<IdPkey> & {
    name: string;
    ordersConnection: EntityConnection<OrderEntity>;
    orders: OrderEntity[];
}

export const Users = new EntityAccessor<UserEntity>('User');
