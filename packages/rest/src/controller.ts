export type HttpMethod = 'GET' | 'POST';

export type Controller<T> = {
    [K in keyof T]: K extends `${HttpMethod} /${string}` ? (...args: any[]) => any : never;
};
