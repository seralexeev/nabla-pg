import { EntityBase, IdPkey, JsonObject } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';
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
