import { PoolClient } from 'pg';

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

const symbol = Symbol('literal');
type LiteralWrapper = { [symbol]: true; value: unknown };

const isLiteralWrapper = (value: unknown): value is LiteralWrapper => {
    return typeof value === 'object' && value !== null && symbol in value;
};

export const literal = (value: string | number | null): LiteralWrapper => ({ [symbol]: true, value });
