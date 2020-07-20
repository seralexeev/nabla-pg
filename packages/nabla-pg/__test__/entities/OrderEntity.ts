import { DefaultValue, EntityBase, IdPkey } from '../../src/entity';
import { EntityAccessor } from '../../src/EntityAccessor';
import { OrderActionEntity } from './OrderActionEntity';
import { UserEntity } from './UserEntity';

const statuses = ['DRAFT', 'NEW', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const;
export type OrderStatus = typeof statuses[number];

export type OrderFeedback = {
    liked: boolean;
    tags: string[];
    comment: string | null;
};

export type OrderEntity = EntityBase<'Order', IdPkey> & {
    status: OrderStatus;
    humanReadableId: DefaultValue<string>;
    userId: string;
    user: UserEntity;
    orderActions: OrderActionEntity[];
    feedback: OrderFeedback | null;
};

export const Orders = new EntityAccessor<OrderEntity>('Order');
