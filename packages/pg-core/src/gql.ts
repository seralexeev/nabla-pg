export type GqlInvoke = <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;
export type GqlClient = { gql: GqlInvoke };
