import chalk from 'chalk';
import dedent from 'dedent';
import { Client } from 'pg';
import sqlFormat from 'sql-formatter';
import util from 'util';

type ExplainOptions = {
    logger?: (message?: any, ...optionalParams: any[]) => any;
    sqlFormat?: (source: string) => string;
};

const explainEnabled = Symbol('explain');

export const enableExplain = (options?: ExplainOptions) => {
    const clientPrototype = Client.prototype as any;
    if (clientPrototype[explainEnabled]) {
        return;
    }

    const logger = options?.logger ?? console.log;
    const formatter = options?.sqlFormat ?? console.log;

    const notExplainable = [
        'CREATE',
        'ALTER',
        'DROP',
        'SAVEPOINT',
        'COMMENT',
        'ROLLBACK',
        'BEGIN',
        'RELEASE',
        'COMMIT',
        'SHOW',
    ];

    const query = Client.prototype.query as any;
    Client.prototype.query = async function (this: Client, text: any, values: any, cb: any) {
        let logQuery: any = text;
        let logValues: any = values;

        if (typeof text === 'object') {
            logQuery = text.text;
            logValues = text.values;
        }

        const isNotExplainable = notExplainable.some((x) => logQuery.toUpperCase().startsWith(x));

        const printDebug = () => {
            logger(chalk.gray('Query:'));
            logger(chalk.yellow(typeof text === 'object' ? formatter(logQuery) : dedent(logQuery)));
            if (logValues) {
                logger(chalk.gray('\nVariables:'));
                logger(util.inspect(logValues, { showHidden: false, depth: null, colors: true }));
            }
        };

        if (!isNotExplainable) {
            await query.call(this, 'BEGIN');
            await query.call(this, 'SAVEPOINT explain');
            await query
                .call(this, 'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS) ' + logQuery, logValues)
                .then((res: any) => {
                    printDebug();
                    logger(chalk.gray('\nExplain:'));
                    logger(chalk.red(res.rows.map((x: any) => x['QUERY PLAN']).join('\n')));
                    logger('\n');
                });
            await query.call(this, 'ROLLBACK TO SAVEPOINT explain');
        } else {
            printDebug();
        }

        return query.call(this, text, values, cb).then((res: any) => {
            if (!isNotExplainable) {
                logger(chalk.gray('\nResult:'));
                logger(chalk.cyan(util.inspect(res?.rows, { showHidden: false, depth: null })));
                logger();
            }

            return res;
        });
    } as any;

    clientPrototype[explainEnabled] = true;
};
