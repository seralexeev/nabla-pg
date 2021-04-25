import Big from 'big.js';
import { GraphQLScalarType, Kind } from 'graphql';
import { SchemaBuilder } from 'postgraphile';

export const ObjectIdScalar = new GraphQLScalarType({
    name: 'Decimal',
    description: 'Decimal type',
    parseValue(value: Big) {
        return value;
    },
    serialize(value: Big | string) {
        return new Big(value);
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Big(ast.value);
        }
        return null;
    },
});

export const PgNumericToBigJsPlugin = (builder: SchemaBuilder) => {
    builder.hook('build', (build) => {
        build.pgRegisterGqlTypeByTypeId('1700', () => ObjectIdScalar);
        return build;
    });
};
