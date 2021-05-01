import { createDefaultPg } from '@flstk/pg';
import { Orders } from './entities/OrderEntity';
import { Users } from './entities/UserEntity';

(async () => {
    const pg = createDefaultPg('postgres://flstk:flstk@localhost:5432/flstk');
    const { id: userId } = await Users.create(pg, {
        item: { name: 'Nick' },
        selector: ['id', 'name'],
    });

    await Orders.create(pg, {
        item: { userId, comment: 'Order #1' },
    });

    const users = await pg.transaction(async (t) => {
        return await Users.find(t, {
            selector: {
                id: true,
                name: true,
                orders: { id: true, comment: true },
            },
        });
    });

    console.log(JSON.stringify(users, null, 2));
})();
