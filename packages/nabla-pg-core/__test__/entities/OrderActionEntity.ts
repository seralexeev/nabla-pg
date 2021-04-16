import { EntityAccessor, EntityBase, IdPkey, JsonObject } from '../../src';
import { UserEntity } from './UserEntity';

export const orderActions = ['CREATE', 'CHANGE', 'FEEDBACK'] as const;
export type OrderActionType = typeof orderActions[number];

export type OrderActionEntity = EntityBase<IdPkey> & {
    orderId: string;
    initiatorId: string;
    initiator: UserEntity;
    type: OrderActionType;
    payload: JsonObject | null;
};

export const OrderActions = new EntityAccessor<OrderActionEntity>('OrderAction');
