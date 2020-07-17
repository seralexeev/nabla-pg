import { Pool, PoolClient, QueryResultRow } from 'pg';

export type SqlInvoke = ReturnType<typeof createSqlClient>;
export const createSqlClient = (client: PoolClient) => {
    return <R>(strings: TemplateStringsArray, ...chunks: unknown[]) => {
        const { query, values } = prepareSql(strings, ...chunks);
        return client.query<R>(query, values);
    };
};

const prepareSql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const result = {
        query: strings[0],
        values: [] as typeof values,
    };

    let index = 1;
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (isLiteralWrapper(value)) {
            result.query += String(value.value);
        } else {
            result.values.push(value);
            result.query += '$' + index;
            index++;
        }

        result.query += strings[i + 1];
    }

    return result;
};

type LiteralWrapper = {
    __LITERAL_VALUE: true;
    value: unknown;
};

const isLiteralWrapper = (value: unknown): value is LiteralWrapper => {
    return typeof value === 'object' && value !== null && '__LITERAL_VALUE' in value;
};

export const literal = (value: unknown): LiteralWrapper => {
    return {
        __LITERAL_VALUE: true,
        value,
    };
};
