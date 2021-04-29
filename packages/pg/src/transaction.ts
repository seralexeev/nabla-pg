export type Transaction<TClient> = TClient & {
    isTransaction: true;
} & TransactionFactory<TClient>;

export type TransactionCallback<TClient, R> = (t: Transaction<TClient>) => Promise<R>;
export type TransactionFactory<TClient> = {
    transaction: <R>(fn: TransactionCallback<TClient, R>) => Promise<R>;
};
