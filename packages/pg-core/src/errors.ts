import { GraphQLError } from 'graphql';

export class NotFoundError extends Error {
    public constructor(message: string) {
        super(message);
    }
}

export class GqlError extends Error {
    constructor(public errors: readonly GraphQLError[]) {
        super('Gql error');
    }
}

export class SqlError extends Error {
    public constructor(public cause: Error, public query: string, public values: unknown[]) {
        super('Sql error');
    }
}
