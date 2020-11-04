import { GraphQLError } from 'graphql/error/GraphQLError';

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class GqlError extends Error {
    constructor(message: string, public errors: readonly GraphQLError[]) {
        super(message);
    }
}
