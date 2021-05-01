/* eslint-disable no-console */
import dedent from 'dedent';
import fs from 'fs';
import { GraphQLObjectType, GraphQLSchema, isListType, isNonNullType, isObjectType, isScalarType } from 'graphql';
import pluralize from 'pluralize';

const warning = `/**
 * This file was auto-generated please do not modify it!
 */\n\n`;

export type MappingConfig = {
    fields?: Record<string, string>;
    extra?: string;
    extraImport?: string;
    pkDef?: string;
};

export type GenerateEntityConfig = {
    prefix?: string;
    entityImportPath: string;
    entityMapping?: Record<string, MappingConfig>;
    ignore?: Record<string, string>;
};

export const generateEntities = (schema: GraphQLSchema, config?: GenerateEntityConfig) => {
    const { prefix = 'Entity', entityImportPath, entityMapping = {}, ignore = {} } = config ?? {};

    const queryTypes = Object.values(schema.getQueryType()?.getFields() ?? {});

    const entities = queryTypes.filter((x) => {
        if (isObjectType(x.type)) {
            return !x.name.endsWith('ByNodeId') && x.type.getInterfaces().some((i) => i.name === 'Node');
        }

        return false;
    });

    const result: Record<string, string> = {};
    for (const entity of entities) {
        const type = entity.type as GraphQLObjectType<any>;
        const entityName = type.name + prefix;
        if (entityName in ignore) {
            console.log(`Skipping ${entityName}`);
            continue;
        }

        const entityConfig = entityMapping[entityName] ?? {};

        let hasIdPkey = false;
        let hasConnection = false;

        const pkKeys = entity.args.map((x) => x.name);
        const pkFields = entity.args.map((x) => [x.name, getFieldInfo(x).type]);

        let pkDef = entityConfig.pkDef ?? '';
        let pk = pkFields
            .map(([name, type]) => `${name}: ${getTSFieldType(name, type, entityConfig.fields)}`)
            .join(', ');

        if (pk === 'id: string') {
            pk = 'IdPkey';
            hasIdPkey = true;
        } else {
            if (!pkDef && pkFields.some(([, type]) => type !== 'UUID')) {
                pkDef = pkFields.map(([name, type]) => `${name}: '${type}!'`).join(', ');
            }
            pk = `{ ${pk} }`;
        }

        const fields = type.getFields();

        const relatedEntities: Record<string, boolean> = {};

        let definition = `export type ${type.name}${prefix} = EntityBase<${pk}> & {\n`;
        for (const field of Object.values(fields)) {
            if (pkKeys.includes(field.name) || field.name === 'nodeId') {
                continue;
            }
            const info = getFieldInfo(field);

            let type = getTSFieldType(field.name, info.type, entityConfig.fields);
            if (info.isEntity) {
                type += prefix;
                relatedEntities[type] = true;
            }
            if (field.name === 'updatedAt' || field.name === 'createdAt') {
                type = 'DefaultValue<Date>';
            } else if (info.isNullable) {
                type += ' | null';
            } else if (info.isList) {
                type = type + '[]';
            } else if (info.isConnection) {
                hasConnection = true;
                type = `EntityConnection<${type}>`;
            }

            definition += `    ${field.name}: ${type};\n`;
        }

        definition += '}\n\n';

        const essentialImports = ['EntityBase', 'DefaultValue'];
        if (hasConnection) {
            essentialImports.push('EntityConnection');
        }

        if (hasIdPkey) {
            essentialImports.push('IdPkey');
        }

        let imports = dedent`
            import type { ${essentialImports.join(', ')} } from '@flstk/pg-core';
            import { EntityAccessor } from '@flstk/pg-core';
        `;

        imports += '\n';

        if (Object.keys(relatedEntities).length > 0) {
            for (const e of Object.keys(relatedEntities)) {
                if (e !== entityName) {
                    if (e in ignore) {
                        imports += ignore[e] + '\n';
                    } else {
                        imports += `import type { ${e} } from '${entityImportPath}/${e}';\n`;
                    }
                }
            }
        }

        const extra = entityConfig.extra ?? '';
        let extraImport = entityConfig.extraImport ?? '';
        if (extraImport) {
            extraImport += '\n';
        }

        definition = imports + extraImport + '\n' + (extra ? `${extra}\n\n` : '') + definition;

        const pkDefStr = pkDef ? `, { pkDef: { ${pkDef} } }` : '';

        definition += `export const ${pluralize(type.name)} = new EntityAccessor<${entityName}>('${
            type.name
        }'${pkDefStr});\n`;

        result[entityName] = warning + definition;
    }

    return result;
};

type FieldInfo = {
    name: string;
    type: string;

    isNullable: boolean;
    isList: boolean;
    isConnection: boolean;
    isEntity: boolean;
};

const defaultFieldTypeMapping: Record<string, string> = {
    UUID: 'string',
    String: 'string',
    Datetime: 'Date',
    ID: 'string',
    Int: 'number',
    JSON: 'any',
    Boolean: 'boolean',
    BigInt: 'number', // TODO: investigate it
};

const getTSFieldType = (name: string, type: string, fieldMapping: Record<string, string> = {}) => {
    if (name in fieldMapping) {
        return fieldMapping[name];
    }

    if (type in defaultFieldTypeMapping) {
        return defaultFieldTypeMapping[type];
    }

    return type;
};

const getFieldInfo = (field: any): FieldInfo => {
    const info: FieldInfo = {
        name: field.name,
        isNullable: true,
        isList: false,
        isConnection: false,
        type: 'any',
        isEntity: false,
    };
    let type = field.type;

    if (isNonNullType(type)) {
        info.isNullable = false;
        type = type.ofType;
    }

    if (isListType(type)) {
        info.isList = true;
        type = type.ofType;
    }

    if (isNonNullType(type)) {
        info.isNullable = false;
        type = type.ofType;
    }

    if (isObjectType(type)) {
        if (type.description?.startsWith('A connection to a list of')) {
            info.type = getFieldInfo(type.getFields().nodes).type;
            info.isConnection = true;
        } else {
            info.type = type.name;
        }

        info.isEntity = true;
    }

    if (isScalarType(type)) {
        info.type = type.name;
    }

    return info;
};

export const generateEntityFiles = (schema: GraphQLSchema, config: GenerateEntityConfig & { entityDir: string }) => {
    const { entityDir, ...generatorConfig } = config;

    if (fs.existsSync(entityDir)) {
        fs.rmdirSync(entityDir, { recursive: true });
    }

    fs.mkdirSync(entityDir, { recursive: true });

    for (const [name, def] of Object.entries(generateEntities(schema, generatorConfig))) {
        fs.writeFileSync(`${entityDir}/${name}.ts`, def, { flag: 'w' });
    }
};
