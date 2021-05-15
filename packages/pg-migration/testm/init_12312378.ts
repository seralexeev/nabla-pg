import { Transaction } from '@flstk/pg';

export default (t: Transaction, logger: any) => {
    t.sql`CREATE TABLE IF NOT EXISTS users (name text)`;
    
    logger('ok');
};
