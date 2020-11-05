# ∇ nabla pg

This is a library that greatly simplifies data access and gives you complete control over types and queries.

When I first saw the [postgraphile](https://github.com/graphile/postgraphile) I was amazed at how easy it is to make a graphical interface to a relational base crossed. With the right data structure and normalization, literally in a few lines, you can get all the benefits of the relational approach and simplicity of a non-relational database such as a mongodb. I have used the postgraphile in several of my projects and it was very convenient and simple. Eventually I switched to typescript and wanted to get full control and type safety over the queries and results. This is how this simple library was born, which can help with this.

Generating code from .graphql files didn't suit me very well. I find this approach too lengthy to define requests and fields in advance, and in the company where I work the requirements change very often.

### Installation

```bash
# npm
npm i nabla-pg-core

# yarn
yarn add nabla-pg-core
```

In order to get proper nullable type inference you have to enable `strict` mode in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "strict": true
    }
}
```

### TLDR

This library doesn't provide a migration functionality, you can use any migration tool you want

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
    , first_name text
    , last_name text
    , gender text
    , updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
    , created_at timestamptz NOT NULL DEFAULT clock_timestamp()
)

CREATE OR REPLACE FUNCTION users_full_name(u users) RETURNS text AS $$
    SELECT concat_ws(' ', last_name, first_name) from users where id = u.id
$$ LANGUAGE sql STABLE;

```

Then you can make queries using typescript and postgraphile:

```ts
import { createSchema, Pg, EntityBase, IdPkey, ReadonlyValue, EntityAccessor } from 'nabla-pg-core';
import { Pool } from 'pg';

type UserEntity = EntityBase<'User', IdPkey> & {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;
};

const Users = new EntityAccessor<UserEntity>('User');

(async () => {
    const connectionString = 'postgres://nabla:nabla@localhost:5433/nabla_db';
    const pool = new Pool({ connectionString });

    const { gql } = new Pg(pool, await createSchema(connectionString));

    const data = await Users.find(gql, {
        selector: ['id'],
        first: 5,
        filter: {
            fullName: {
                includesInsensitive: 'Nik',
            },
        },
    });

    console.log(data);
})();
```

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
export type UserEntity = EntityBase<'User', IdPkey> & {
    firstName: string | null;
    lastName: string | null;
};
```

`EntityBase` will complement our type with common fields such as primary key and `__typename` and `updatedAt`, `createdAt`.

To access this structure, we define the `EntityAccessor` special object as follows:

```typescript
export const Users = new EntityAccessor<UserEntity>('User');
```

And that's it! Now we can work with this entity using the full power of typescript:

```typescript
const users = await Users.find(t.gql, {
    selector: ['id', 'firstName'],
});

// const users: Array<{
//    id: NominalType<string, "default">;
//    firstName: string;
// }>
```

The selectors can be of 2 types: `Arrays of primitive keys` and `object shapes`. Use arrays if you want to select a flat structure. For more complex things, such as subqueries, use object literals. The request above is equivalent to the request below:

```typescript
const users = await Users.find(t.gql, {
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
export type UserEntity = EntityBase<'User', IdPkey> & {
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
    const { id } = await Users.create(t.gql, {
        item: {
            firstName: 'Alex',
            lastName: 'Ivanov',
        },
        selector: ['id'],
    });

    // we're selecting readonly field defied by `users_full_name` function
    const { fullName } = await Users.findByPkOrError(t.gql, {
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

export type OrderEntity = EntityBase<'Order', IdPkey> & {
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
const usersWithOrders = await Users.find(pg.gql, {
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
const usersWithOrders = await Users.find(pg.gql, {
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

```typescript
find = <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    query: Query<E, F>,
): Promise<Array<OriginInfer<E, F>>>

findAndCount = <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    query: Query<E, F>,
): Promise<FindAndCountResult<E, F>>

count = (
    gql: GqlInvoke, query: FindOptions<E>
): Promise<CountResult>

findOne = <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    args: { selector: F; filter: Filter<E> },
): Promise<OriginInfer<E, F> | null>

findOneOrError = async <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    args: { filter: Filter<E>; selector: F },
): Promise<OriginInfer<E, F>>

findByPk = <F extends FieldSelector<E, F> = []>(
    gql: GqlInvoke,
    args: { pk: PrimaryKey<E>; selector?: F },
): Promise<OriginInfer<E, F> | null>

findByPkOrError = async <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    args: { pk: PrimaryKey<E>; selector: F },
): Promise<OriginInfer<E, F>>

create = <F extends FieldSelector<E, F> = []>(
    gql: GqlInvoke,
    args: { item: EntityCreate<E>; selector?: F },
): Promise<OriginInfer<E, F>>

update = <F extends FieldSelector<E, F> = []>(
    gql: GqlInvoke,
    args: { pk: PrimaryKey<E>; patch: EntityPatch<E, PrimaryKey<E>>; selector?: F },
): Promise<OriginInfer<E, F>>

delete = <F extends FieldSelector<E, F> = []>(
    gql: GqlInvoke,
    args: { pk: PrimaryKey<E>; selector?: F },
): Promise<OriginInfer<E, F>>

findOneOrCreate = async <F extends FieldSelector<E, F>>(
    gql: GqlInvoke,
    args: { filter: Filter<E>; selector: F; item: EntityCreate<E> },
): Promise<OriginInfer<E, F>>

updateOrCreate = async <F extends FieldSelector<E, F> = []>(
    gql: GqlInvoke,
    args: {
        pk: PrimaryKey<E>;
        selector?: F;
        item: EntityCreate<E>;
        patch?: EntityPatch<E, PrimaryKey<E>>;
    },
): Promise<OriginInfer<E, F>>
```

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
