import { Pool } from 'pg';
import { createPg, Pg } from '../db';
import { EntityBase, IdPkey, ReadonlyValue } from '../db/entity';
import { EntityAccessor } from '../db/EntityAccessor';
import { createSchema } from '../db/gql';

describe('query', () => {
    const connectionString = 'postgres://nabla:nabla@localhost:5433/nabla_db';
    let pg!: Pg;

    beforeAll(async () => {
        const pool = new Pool({ connectionString });
        const schema = await createSchema(connectionString);
        pg = createPg(pool, schema);

        await pg.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    });

    it('query entity fields', async () => {
        const { sql } = pg;

        await sql`CREATE TABLE IF NOT EXISTS users (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
          , first_name text
          , last_name text
          , sex text
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;

        await sql`CREATE TABLE IF NOT EXISTS roles (
            name text PRIMARY KEY
          , permissions text[] NOT NULL DEFAULT '{}'
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
        )`;

        await sql`CREATE TABLE IF NOT EXISTS user2roles (
            user_id uuid NOT NULL CONSTRAINT user2roles_user_id_fkey REFERENCES users(id)
          , role_name text NOT NULL CONSTRAINT user2roles_role_name_fkey REFERENCES roles(name)
          , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
          , PRIMARY KEY (user_id, role_name)
        )`;

        await sql`comment on constraint user2roles_user_id_fkey on user2roles is E'@manyToManyFieldName users\n@manyToManySimpleFieldName usersList'`;
        await sql`comment on constraint user2roles_role_name_fkey on user2roles is E'@manyToManyFieldName roles\n@manyToManySimpleFieldName rolesList'`;

        await sql`CREATE OR REPLACE FUNCTION users_full_name(u users) RETURNS text AS $$
            SELECT concat_ws(' ', last_name, first_name) from users where id = u.id
        $$ LANGUAGE sql STABLE`;

        const permissions = ['*', 'orders.view', 'orders.create', 'payment.confirm'] as const;
        type Permission = typeof permissions[number];

        type RoleEntity = EntityBase<'Role', { name: string }> & {
            permissions: Permission[];
            usersList: UserEntity[];
        };

        type UserEntity = EntityBase<'User', IdPkey> & {
            firstName: string | null;
            middleName: string | null;
            lastName: string | null;
            fullName: ReadonlyValue<string>;

            rolesList: RoleEntity[];
        };

        type User2RoleEntity = EntityBase<'User2Role', { userId: string; roleName: string }>;

        class RoleAccessor extends EntityAccessor<RoleEntity> {
            public constructor() {
                super({ typeName: 'Role' });
            }

            public getPkArg = (pk: { name: string }) => {
                return Object.keys(pk)
                    .map((x) => `$${x}: String!`)
                    .join(', ');
            };
        }

        const Roles = new RoleAccessor();
        const Users = new EntityAccessor<UserEntity>({ typeName: 'User' });
        const User2Roles = new EntityAccessor<User2RoleEntity>({ typeName: 'User2Role' });

        const id = await pg.transaction(async (t) => {
            const { id } = await Users.create(t.gql, {
                item: {
                    firstName: 'Alex',
                    lastName: 'Ivonov',
                },
                selector: ['id'],
            });

            const { fullName } = await Users.findByPkOrError(t.gql, {
                pk: { id },
                selector: ['fullName'],
            });

            expect(fullName).toBe('Ivonov Alex');

            return id;
        });

        await pg.transaction(async (t) => {
            const roleName = await Roles.create(t.gql, {
                item: { permissions: ['orders.create', 'orders.view'], name: 'client' },
                selector: ['name'],
            }).then((x) => x.name);

            await User2Roles.create(t.gql, {
                item: { roleName, userId: id },
            });
        });

        const users = await pg.transaction(async (t) => {
            return Users.find(t.gql, {
                selector: {
                    id: true,
                    fullName: true,
                    rolesList: ['name', 'permissions'],
                },
            });
        });

        expect(users[0].rolesList[0].name).toBe('client');
    });
});
