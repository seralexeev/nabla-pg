# @flstk/pg

This is a part of [the fullstack toolbelt](../) provides a simple and clear way to manage your data access layer based on [postgraphile](https://github.com/graphile/postgraphile). You can consider it as a replacement for a more traditional ORM based approach such [sequelize](https://github.com/sequelize/sequelize) or [TypeORM](https://github.com/typeorm/typeorm).

-   Uses all the power of **typescript's** type system;
-   Provides **codegen cli** to keep your code up to date with your db;
-   Migrations with cli;
-   Transaction and safepoint support;
-   Rich and explains in debug mode;
-   Provides low level api when necessary to do raw sql queries;
-   Simple, straightforward and strongly types api;
-   React hooks.

## Installation

```bash
# npm
npm i @flstk/pg

# yarn
yarn add @flstk/pg
```

In order to get proper nullable type inference you have to enable `strict` mode in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "strict": true
    }
}s
```

## Getting started

The whole idea is quite simple.

1. [Define your database structure](#defining-database-structure);
2. Generate entities using provided cli;
3. Use provided typed query api.

### Defining database structure.

This library provides a database [migration tool](../pg-migration), but it's not necessary to use it. You can use any migration tool ([graphile-migrate](https://github.com/graphile/migrate), [TypORM](https://github.com/typeorm/typeorm), [sequelize](https://github.com/sequelize/sequelize), [node-pg-migrate](https://github.com/salsita/node-pg-migrate), etc.) as you want or or use just a plain DDL queries.

To generate empty migration run command:

```bash
npx @flstk/pg-migration create -d src/migrations first_migration
```

-   `-d src/migrations` is a directory of your migrations
-   `first_migration` is a name of migration

for more information run `npx @flstk/pg-migration -h`

This will create a new file `<timestamp>_name.ts` in the specified directory with empty function:

```ts
export default async (t: Transaction) => {};
```

All migrations run in a transaction, so you won't get corrupted state of your database.

`Transaction` - an interface with following methods:

-   `sql` - low level api, works with tagged template strings and handles potential sql injections
-   `gql` - low level api, to work with postgraphile directly
-   `savepoint` - creates [postgres SAVEPOINT](https://www.postgresql.org/docs/current/sql-savepoint.html)

Good practice is to keep your migrations immutable and don't import any data or methods which can be changed. Let's create our first migration.

```ts
export default async (t: Transaction) => {
    await t.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await t.sql`CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = clock_timestamp();
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql`;

    await t.sql`CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
        , name text
        , email text
        , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
        , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`;

    await t.sql`CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at()`;
};
```

As you can see `sql` method takes tagged template as argument and returns promise;

-   On the first call we create extension `uuid-ossp` in order to use uuid type in our models;
-   The second call creates function which updates `updated_at` automatically when row is being updated;
-   The third call creates our entity;
-   The fourth call creates trigger to call `trigger_set_updated_at` on every row change.

You can omit all the `updated_at` steps, but it is a good practice to have this field and `created_at` as well.

To apply this and all migration from directory you have run following command:

```bash
npx @flstk/pg-migration run -d src/migrations -c 'postgres://flstk:flstk@localhost:5432/flstk'
```

-   `-d src/migrations` is a directory of your migrations
-   `-c postgres://flstk:flstk@localhost:5432/flstk` is a connection string to the database

The next step is entity code generation. It's always challenging to keep your code and mode up to date, but fortunately there is a code gen cli:

```bash
@flstk/pg -d src/entities/generated -i @projects/expat/shared/entities/generated -c 'postgres://flstk:flstk@localhost:5432/flstk'
```

-   `-d src/entities/generated` is a directory of your entities (if it's not present cli will create it)
-   `-c postgres://flstk:flstk@localhost:5432/flstk` is a connection string to the database
-   `-i @projects/entities/generated` is an import path. It necessary if you use path aliases in your project. If not, just omit this argument and all imports will be relative.

The command creates directory and generates typescript files with entity definitions:

```ts
/**
 * This file was auto-generated please do not modify it!
 * To update models use @flstk/pg cli
 */

import type { EntityBase, DefaultValue, EntityConnection, IdPkey } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';

export type UserEntity = EntityBase<IdPkey> & {
    name: string | null;
    email: string | null;
    updatedAt: DefaultValue<Date>;
    createdAt: DefaultValue<Date>;
};

export const Users = new EntityAccessor<UserEntity>('User');
```

As you can see the the cli generated type according your db model. That's it.

## Queries

**@flstk/pg** exposes single interface to your database: [Pg](./src/db.ts). Using this object you can make any queries, it uses [node-postgres](https://github.com/brianc/node-postgres) pool for connection pooling under the hood. In order to get `Pg` your can use factory method `createDefaultPg` or create new instance of `Pg` class if you need full control. Save this instance as a singleton and use it while your app is running.

### createDefaultPg

Using this factory is the most preferable way to create an `Pg` instance.
The first argument is `connection string` (`postgres://password:user@host:port/database`) or [Pool](https://node-postgres.com/api/pool) instance. The second argument is an [additional configuration](#configuration). The library uses `NonNullRelationsPlugin`,`PgNumericToBigJsPlugin`, `ConnectionFilterPlugin`, `PgManyToManyPlugin`,`PgSimplifyInflectorPlugin` and some special configurations.

`Pg` instance has several extremely convenient methods:

1. `getSchema: Promise<GraphQLSchema>` - to get postgraphile generated Graphql schema
2. `transaction: <T>(fn: ServerSavepointCallback<T>): Promise<T>` - to make a new transaction / savepoint
3. `sql` - low level api to execute raw sql queries
4. `gql` - low level api to execute raw gql queries

### Queries

The whole idea is quite simple. We define the database structure in a familiar way, through migrations. For example, we have a table with users (for working with sql in ts code I use [vscode-sql-tagged-template-literals](https://marketplace.visualstudio.com/items?itemName=frigus02.vscode-sql-tagged-template-literals)):

```typescript
await sql`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    , first_name text
    , last_name text

    , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
)`;
```

It's a very simple structure. Then we need to repeat it in terms of our entities:

```typescript
export type UserEntity = EntityBase<IdPkey> & {
    firstName: string | null;
    lastName: string | null;
};
```

`EntityBase` will complement our type with common fields such as primary key and `__typename`.

To access this structure, we define the `EntityAccessor` special object as follows:

```typescript
export const Users = new EntityAccessor<UserEntity>('User');
```

And that's it! Now we can work with this entity using the full power of typescript:

```typescript
const users = await Users.find(pg, {
    selector: ['id', 'firstName'],
});

// const users: Array<{
//    id: NominalType<string, "default">;
//    firstName: string;
// }>
```

The selectors can be of 2 types: `Arrays of primitive keys` and `object shapes`. Use arrays if you want to select a flat structure. For more complex things, such as subqueries, use object literals. The request above is equivalent to the request below:

```typescript
const users = await Users.find(pg, {
    selector: {
        id: true,
        firstName: true,
    },
});

// const users: Array<{
//    id: NominalType<string, "default">;
//    firstName: string;
// }>
```

Let's complicate the task and add a fullname field which is calculated:

```typescript
await sql`CREATE OR REPLACE FUNCTION users_full_name(u users) RETURNS text AS $$
    SELECT concat_ws(' ', last_name, first_name) from users where id = u.id
$$ LANGUAGE sql STABLE`;
```

Then add the field to our entity declaration as `Readonly`:

```typescript
export type UserEntity = EntityBase<IdPkey> & {
    firstName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;
};
```

This field can also be selected using selectors, but it will not participate in entity creation or updating.

### Entity creation

There are special methods for creating objects in `EntityAccessor`:

```typescript
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
```

Typescript will provide the necessary types when creating and updating objects. Nullable fields become null | undefined and other fields become mandatory when creating.

### Relationships

In entities, you can define all the relationships that `postgraphile` creates. Let's imagine that we create a system where the user can create orders:

```typescript
const statuses = ['DRAFT', 'NEW', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const;
export type OrderStatus = typeof statuses[number];

export type OrderFeedback = {
    liked: boolean;
    tags: string[];
    comment: string | null;
};

export type OrderEntity = EntityBase<IdPkey> & {
    status: OrderStatus;
    humanReadableId: DefaultValue<string>;
    userId: string;
    user: UserEntity;
    orderActions: OrderActionEntity[];
    feedback: OrderFeedback | null;
};

export const Orders = new EntityAccessor<OrderEntity>('Order');
```

Let's create a migration for the entity:

```typescript
await sql`CREATE SEQUENCE IF NOT EXISTS orders_human_readable_id START 100`;
await sql`
    CREATE OR REPLACE FUNCTION get_next_order_id() RETURNS TEXT AS $$ 
        SELECT LPAD(nextval('orders_human_readable_id')::text, 6, '0');
    $$ LANGUAGE SQL;
`;

await sql`CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    , human_readable_id text NOT NULL DEFAULT get_next_order_id()
    , user_id uuid NOT NULL REFERENCES users(id)
    , status text NOT NULL
    , feedback jsonb

    , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
)`;

await sql`CREATE TABLE IF NOT EXISTS order_actions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    , order_id uuid NOT NULL REFERENCES orders(id)
    , initiator_id uuid NOT NULL REFERENCES users(id)
    , type text NOT NULL
    , payload jsonb

    , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
)`;
```

And add a list of orders to the user definition:

```typescript
export type UserEntity = EntityBase<IdPkey> & {
    firstName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;

    // array of OrderEntity
    orders: OrderEntity[];
};
```

Now we can choose the users we are interested in, only with those order fields that we are interested in:

```typescript
const usersWithOrders = await Users.find(pg, {
    selector: {
        id: true,
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
    offset: 2,
    filter: {
        fullName: {
            includesInsensitive: 'Nik',
        },
    },
});

// const usersWithOrders: Array<{
//    id: NominalType<string, "default">;
//    orders: Array<Pick<OrderEntity, "id" | "feedback" | "createdAt">>;
// }>
```

As can be seen, despite the fact that orders are an array, the selector understands this and allows you to specify the structures of an element of an array and not the field of the array itself. You must have noticed the call of the `Orders.createQuery` method. It's one of the helpers that helps make subqueries. But if we want to select all the orders, we can omit it and just write the selector:

```typescript
const usersWithOrders = await Users.find(pg, {
    selector: {
        id: true,
        orders: ['id', 'feedback', 'createdAt'],
    },
    first: 5,
    offset: 2,
    filter: {
        fullName: {
            includesInsensitive: 'Nik',
        },
    },
});

// const usersWithOrders: Array<{
//    id: NominalType<string, "default">;
//    orders: Array<Pick<OrderEntity, "id" | "feedback" | "createdAt">>;
// }>
```

The inferred shape will be identical, but the result will be - all orders of the user.
There are also other helpers that help make subqueries and reuse selectors and subqueries:

```typescript
EntityAccessor.createSelector;
EntityAccessor.createQuery;
EntityAccessor.createConnectionQuery;
```

For the time `EntityAccessor` has methods:

-   `find`,
-   `findAndCount`,
-   `count`,
-   `findOne`,
-   `findOneOrError`,
-   `findByPk`,
-   `findByPkOrError`,
-   `create`,
-   `update`,
-   `delete`,
-   `findOneOrCreate`,
-   `updateOrCreate`

### Client usage:

This library can be used both on the server and on clients. We marvel at our entities in a mono repository. This greatly speeds up the development of our internal admin. To do this, just override `GqlInvoke`. Here is a real example of how easy it is to create an order list from our code base:

```tsx
import * as icons from '@ant-design/icons';
import { OrderEntity, Orders, OrderStatus } from '@core/entities/OrderEntity';
import { Filter, SelectorShape } from '@core/graphql/helpers';
import { createColumns, GqlTable } from '@office/components/GqlTable';
import { HandledModal, useModalHandle } from '@office/components/HandledModal';
import { OrderPolymorphic } from '@office/modules/order/components/OrderPolymorphic';
import { OrderStatusTag } from '@office/modules/order/components/OrderStatusTag';
import { OrderTypeTag } from '@office/modules/order/components/OrderTypeTag';
import { UserPreviewIcon } from '@office/modules/user/components/UserPreview';
import { userPreviewIconSelector } from '@office/modules/user/components/utils';
import { uikit } from '@office/ui-kit';
import * as antd from 'antd';
import React, { FC, Fragment, useState } from 'react';
import { OrderPaymentTag } from '@office/modules/order/components/OrderPaymentTag';

const selector = Orders.createSelector({
    id: true,
    status: true,
    type: true,
    user: userPreviewIconSelector,
    initiator: userPreviewIconSelector,
    paymentStatus: true,
    paymentFlow: true,
    createdAt: true,
    updatedAt: true,
});

const columns = createColumns<typeof selector>([
    { title: 'Type', render: (_, record) => <OrderTypeTag type={record.type} /> },
    { title: 'Created at', render: (_, record) => <uikit.DateWithPopup date={record.createdAt} /> },
    { title: 'Status', render: (_, record) => <OrderStatusTag type={record.type} status={record.status} /> },
    { title: 'User', render: (_, record) => <UserPreviewIcon item={record.user} /> },
    { title: 'Initiator', render: (_, record) => <UserPreviewIcon item={record.initiator} /> },
]);

export const OrderEntityList: FC<{ userId?: string }> = ({ userId }) => {
    const filter: Filter<OrderEntity> : undefined = userId ? { userId: { equalTo: userId } } : undefined;

    return (
        <GqlTable
            repository={Orders}
            selector={selector}
            rowKey={(x) => x.id}
            filter={filter}
            columns={columns}
        />
    );
};
```

And `GqlTable.tsx`:

```tsx
import { EntityBase } from '@core/entities/EntityBase';
import { GqlRepository } from '@core/graphql/GqlRepository';
import { FieldSelector, Filter, SelectorShape } from '@core/graphql/helpers';
import { useListFetcher, UseListFetcherOptions } from '@office/hooks/useListFetcher';
import { uikit } from '@office/ui-kit';
import * as antd from 'antd';
import { ColumnsType, TableProps } from 'antd/lib/table';
import React, { Fragment, ReactNode } from 'react';

export type Props<E extends EntityBase, F extends FieldSelector<E, F>> = {
    repository: GqlRepository<E>;
    selector: F;
    filter?: Filter<E>;
    orderBy?: Array<[keyof E, 'ASC' | 'DESC']>;
    columns: ColumnsType<SelectorShape<F>>;
    rowKey: (x: SelectorShape<F>) => string;
    toolbar?: ReactNode;
    readonly?: boolean;
    options?: UseListFetcherOptions;
};

export const createColumns = <F>(columns: ColumnsType<SelectorShape<F>>) => {
    return columns;
};

export const GqlTable = <E extends EntityBase, F extends FieldSelector<E, F>>({
    selector,
    filter,
    orderBy = [['createdAt', 'DESC']],
    repository,
    columns,
    rowKey,
    toolbar,
    readonly,
    options,
    ...props
}: TableProps<SelectorShape<F>> & Props<E, F>) => {
    const [data, { loading, refetch }, pagination] = useListFetcher(repository, { selector, filter, orderBy }, options);

    if (loading) {
        return <uikit.Spinner />;
    }

    if (!data) {
        return <uikit.EmptyStub />;
    }

    return (
        <Fragment>
            <uikit.ToolBar refetch={refetch} children={toolbar} readonly={readonly} />
            <antd.Table
                size='small'
                bordered
                showHeader
                columns={columns}
                dataSource={data.items as any}
                pagination={pagination}
                rowKey={rowKey}
                {...props}
            />
        </Fragment>
    );
};
```

You can find more examples in the tests
![Example](../../images/example1.gif)

### TLDR;

[full example](../pg-example)

```ts
import { Pg, generateEntityFiles, createDefaultPg } from '@flstk/pg';
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

    const users = await Users.find(t, {
        selector: {
            id: true,
            name: true,
            orders: { id: true, comment: true },
        },
    });

    console.log(JSON.stringify(users, null, 2));
})();
```
