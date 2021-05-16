import { MigrationResolver } from '@projects/expat/api/modules/migrations/resolver';
import { buildSchema } from 'type-graphql';

export const buildGqlSchema = async () => {
    const schema = await buildSchema({
        resolvers: [MigrationResolver],
    });

    return schema;
};
