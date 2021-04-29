import { SqlError } from '@flstk/pg/errors';
import { Literal } from '@flstk/pg/literal';
import { PoolClient } from 'pg';

export type SqlInvoke = ReturnType<typeof createSqlClient>;
export const createSqlClient = (client: PoolClient) => {
    return async <R>(strings: TemplateStringsArray, ...chunks: unknown[]) => {
        const { query, values } = prepareSql(strings, ...chunks);
        
        try {
            return client.query<R>(query, values);
        } catch (error) {
            throw new SqlError(error, query, values);
        }
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
        if (Literal.isLiteral(value)) {
            result.query += value.toString();
        } else {
            result.values.push(value);
            result.query += '$' + index;
            index++;
        }

        result.query += strings[i + 1];
    }

    return result;
};
