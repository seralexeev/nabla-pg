import { EntityBase, IdPkey, JsonObject } from '../../db/entity';
import { UserEntity } from './UserEntity';
import { EntityAccessor } from '../../db/EntityAccessor';

export const orderActions = ['CREATE', 'CHANGE', 'FEEDBACK'] as const;
export type OrderActionType = typeof orderActions[number];

export type OrderActionEntity = EntityBase<'OrderAction', IdPkey> & {
    orderId: string;
    initiatorId: string;
    initiator: UserEntity;
    type: OrderActionType;
    payload: JsonObject | null;
};

export const OrderActions = new EntityAccessor<OrderActionEntity>('OrderAction');
