import { Pool } from 'pg';
import { Pg } from '../src';
import { OrderActions } from './entities/OrderActionEntity';
import { OrderFeedback, Orders } from './entities/OrderEntity';
import { Roles } from './entities/RoleEntity';
import { User2Roles } from './entities/User2RoleEntity';
import { Users } from './entities/UserEntity';
// import { enableExplain } from '../../nabla-pg-explain/src';

const connectionString = 'postgres://nabla:nabla@localhost:5433/nabla_db';

// enableExplain();

describe('EntityAccessor tests', () => {
    let pg: Pg;

    beforeAll(async () => {
        pg = new Pg(new Pool({ connectionString }));

        await pg.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

        await pg.sql`CREATE TABLE IF NOT EXISTS users (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
          , first_name text
          , last_name text
          , gender text
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;

        await pg.sql`CREATE OR REPLACE FUNCTION users_full_name(u users) RETURNS text AS $$
            SELECT concat_ws(' ', last_name, first_name) from users where id = u.id
        $$ LANGUAGE sql STABLE`;

        await pg.sql`CREATE TABLE IF NOT EXISTS roles (
            name text PRIMARY KEY
          , permissions text[] NOT NULL DEFAULT '{}'
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;

        await pg.sql`CREATE TABLE IF NOT EXISTS user2roles (
            user_id uuid NOT NULL CONSTRAINT user2roles_user_id_fkey REFERENCES users(id)
          , role_name text NOT NULL CONSTRAINT user2roles_role_name_fkey REFERENCES roles(name)
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , PRIMARY KEY (user_id, role_name)
        )`;

        await pg.sql`comment on constraint user2roles_user_id_fkey on user2roles is E'@manyToManyFieldName users\n@manyToManySimpleFieldName usersList'`;
        await pg.sql`comment on constraint user2roles_role_name_fkey on user2roles is E'@manyToManyFieldName roles\n@manyToManySimpleFieldName rolesList'`;

        await pg.sql`CREATE SEQUENCE IF NOT EXISTS orders_human_readable_id START 100`;
        await pg.sql`
            CREATE OR REPLACE FUNCTION get_next_order_id() RETURNS TEXT AS $$ 
                SELECT LPAD(nextval('orders_human_readable_id')::text, 6, '0');
            $$ LANGUAGE SQL;
        `;

        await pg.sql`CREATE TABLE IF NOT EXISTS orders (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
          , human_readable_id text NOT NULL DEFAULT get_next_order_id()
          , user_id uuid NOT NULL REFERENCES users(id)
          , status text NOT NULL
          , feedback jsonb
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;

        await pg.sql`CREATE TABLE IF NOT EXISTS order_actions (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
          , order_id uuid NOT NULL REFERENCES orders(id)
          , initiator_id uuid NOT NULL REFERENCES users(id)
          , type text NOT NULL
          , payload jsonb
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;
    });

    afterAll(async () => {
        try {
            await pg.sql`DROP TABLE user2roles`;
            await pg.sql`DROP TABLE roles`;
            await pg.sql`DROP FUNCTION users_full_name`;
            await pg.sql`DROP TABLE order_actions`;
            await pg.sql`DROP TABLE orders`;
            await pg.sql`DROP SEQUENCE IF EXISTS orders_human_readable_id`;
            await pg.sql`DROP TABLE users`;
            await pg.pool.end();
        } catch (e) {
            console.error(e);
        }
    });

    it('creates user role', async () => {
        const pg = new Pg(new Pool({ connectionString }));

        // explicit transaction
        const id = await pg.transaction(async (t) => {
            const { id } = await Users.create(t, {
                item: {
                    firstName: 'Alex',
                    lastName: 'Ivanov',
                },
                selector: ['id'],
            });

            // we're selecting readonly field defied by `users_full_name` function
            const { fullName } = await Users.findByPkOrError(t, {
                pk: { id },
                selector: ['fullName'],
            });

            expect(fullName).toBe('Ivanov Alex');

            return id;
        });

        await pg.transaction(async (t) => {
            const roleName = await Roles.create(t, {
                item: { permissions: ['orders.create', 'orders.view'], name: 'client' },
                selector: ['name'],
            }).then((x) => x.name);

            await User2Roles.create(t, {
                item: {
                    roleName,
                    userId: id,
                },
            });
        });

        const users = await pg.transaction(async (t) => {
            return Users.find(t, {
                selector: {
                    id: true,
                    fullName: true,
                    rolesList: ['name', 'permissions'],
                },
            });
        });

        expect(users[0].rolesList[0].name).toBe('client');
    });

    it('creates orders and gets them', async () => {
        const pg = new Pg(new Pool({ connectionString }));

        const userId = await Users.create(pg, {
            item: {
                firstName: 'Nikita',
                lastName: 'Petrov',
            },
            selector: ['id'],
        }).then((x) => x.id);

        // create order with action in single transaction
        const order = await pg.transaction(async (t) => {
            const order = await Orders.create(t, {
                item: { status: 'NEW', userId },
                selector: ['id', 'humanReadableId'],
            });

            await OrderActions.create(t, {
                item: {
                    initiatorId: userId,
                    orderId: order.id,
                    type: 'CREATE',
                },
            });

            return order;
        });

        // create another order with action in single transaction
        await pg.transaction(async (t) => {
            const order = await Orders.create(t, {
                item: { status: 'NEW', userId },
                selector: ['id', 'humanReadableId'],
            });

            await OrderActions.create(t, {
                item: {
                    initiatorId: userId,
                    orderId: order.id,
                    type: 'CREATE',
                },
            });

            return order;
        });

        // create feedback for order in single transaction
        await pg.transaction(async (t) => {
            const feedback: OrderFeedback = {
                comment: 'Everything was perfect',
                liked: true,
                tags: ['In time', 'Polite'],
            };

            await Orders.update(t, {
                pk: { id: order.id },
                patch: { feedback },
            });

            await OrderActions.create(t, {
                item: {
                    initiatorId: userId,
                    orderId: order.id,
                    type: 'FEEDBACK',
                    payload: feedback,
                },
            });
        });

        const usersWithOrders = await Users.find(pg, {
            selector: {
                id: true,
                firstName: true,
                orders: Orders.createQuery({
                    selector: ['id', 'feedback', 'createdAt'],
                    filter: {
                        feedback: { isNull: false },
                    },
                    first: 10,
                    offset: 0,
                    orderBy: [['createdAt', 'DESC']],
                }),
            },
            first: 5,
            filter: {
                fullName: {
                    includesInsensitive: 'Nik',
                },
            },
        });

        expect(usersWithOrders.length).toBe(1);
        expect(usersWithOrders.flatMap((x) => x.orders).length).toBe(1);
    });
});
