import { GraphQLField, GraphQLFieldMap, GraphQLList, GraphQLNonNull, GraphQLSchema, GraphQLObjectType } from 'graphql';
import { createSchema } from './gql';

type GeneratorOptions = {};

const generateEntities = (schema: GraphQLSchema, options?: GeneratorOptions) => {
    return schema;
};

const typeMap: Record<string, string> = {
    UUID: 'string',
    String: 'string',
    Datetime: 'Date',
    Int: 'number',
    Boolean: 'boolean',
    JSON: 'Json',
    BigFloat: 'Big',
};

const getTypeName = (type: any) => {
    let nonNullable = false;
    let isArray = false;
    let isConnection = false;
    while (!type.name) {
        switch (true) {
            case type instanceof GraphQLList: {
                isArray = true;
            }
            case type instanceof GraphQLNonNull: {
                nonNullable = true;
            }
        }

        type = type.ofType;
    }

    const [name, connectionSuffix] = type.name.split('Connection');
    if (connectionSuffix === '') {
        isConnection = true;
    }

    let finalType = typeMap[name] ?? name;
    if (!nonNullable) {
        finalType += ' | null';
    } else if (isArray) {
        finalType += '[]';
    } else if (isConnection) {
        finalType = `EntityConnection<${finalType}>`;
    }

    return finalType;
};

(async () => {
    const connectionString = 'postgres://ludwig:ludwig@localhost:5432/ludwig_db';
    const schema = await createSchema(connectionString);
    const ss = generateEntities(schema);
    const fields = Object.values(ss.getQueryType()?.getFields() ?? {});
    const entities = fields.reduce((acc, x) => {
        if (x.description?.startsWith('Reads a set of')) {
            if (
                x.type instanceof GraphQLList &&
                x.type.ofType instanceof GraphQLNonNull &&
                x.type.ofType.ofType instanceof GraphQLObjectType
            ) {
                acc[x.type.ofType.ofType.name] = x;
            }
        }
        return acc;
    }, {} as Record<string, GraphQLField<any, any>>);

    for (const entity of fields.filter((x) => {
        if (x instanceof GraphQLObjectType) {
            if (x.name in entities) {
                return true;
            }
        }

        return false;
    })) {
        const type: any = entity.type;
        const realType = type.ofType.ofType;
        const name = realType.name;
        console.log(name);
        if (name === 'CleaningOrder2CleaningOption') {
            console.log(entity);
        }

        let imports: string[] = [];
        let fields: string[] = [];
        for (const field of Object.values(realType.getFields() as GraphQLFieldMap<any, any>)) {
            if (field.name === 'nodeId') {
                continue;
            }

            const name = getTypeName(field.type);

            fields.push(`${field.name}: ${name}`);
        }

        console.log(fields);
    }
})();
