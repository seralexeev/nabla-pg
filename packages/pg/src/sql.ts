import { SqlError } from '@flstk/pg-core';
import { Literal } from '@flstk/pg/literal';
import { PoolClient } from 'pg';

export type SqlInvoke = <T = any>(strings: TemplateStringsArray, ...chunks: unknown[]) => Promise<T[]>;
export type SqlClient = { sql: SqlInvoke };

export class SqlClientImpl implements SqlClient {
    public constructor(private client: PoolClient) {}

    public sql = async <T = any>(strings: TemplateStringsArray, ...chunks: unknown[]): Promise<T[]> => {
        const { query, values } = this.prepareSql(strings, ...chunks);

        try {
            const x = await this.client.query<T>(query, values);
            return x.rows;
        } catch (error) {
            throw new SqlError(error, query, values);
        }
    };

    private prepareSql = (strings: TemplateStringsArray, ...values: unknown[]) => {
        const result = { query: strings[0], values: [] as typeof values };

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
}
