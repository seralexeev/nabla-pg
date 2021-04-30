export type SavepointCallback<TClient, T> = (s: SavepointScope<TClient>) => Promise<T>;
export type SavepointScope<TClient> = TClient & {
    savepoint: <R>(fn: SavepointCallback<TClient, R>) => Promise<R>;
};
