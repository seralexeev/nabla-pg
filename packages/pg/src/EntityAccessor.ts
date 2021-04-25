import { EntityBase, EntityConnection, EntityCreate, EntityPatch, InferPrimaryKey } from '@flstk/pg/entity';
import { Filter } from '@flstk/pg/filter';
import {
    ByPkQuery,
    ConnectionQuery,
    CountResult,
    CreateMutation,
    DeleteMutation,
    FindAndCountResult,
    FindOneQuery,
    GqlClient,
    Query,
    SelectQuery,
    UpdateMutation,
} from '@flstk/pg/query';
import { FieldSelector, OriginInfer } from '@flstk/pg/selector';
import { NominalType } from '@flstk/utils/types';
import { camelCase } from 'camel-case';
import { constantCase } from 'constant-case';
import deepmerge from 'deepmerge';
import pluralize from 'pluralize';

const symbol = Symbol('meta');

const knownQueryOptions = ['filter', 'first', 'offset', 'orderBy'] as const;
type VariableKeys = typeof knownQueryOptions[number];

type PrepareQueryContext = {
    varsDeclaration: string[];
    variables: any;
    level: number;
};

type QueryMeta<E> = Record<VariableKeys, string> & {
    defaultFilter?: Filter<E>;
};

type RepositoryConfig<E extends EntityBase> = {
    defaultFilter?: Filter<E>;
    pk?: Record<keyof InferPrimaryKey<E>, 'UUID!' | 'String!' | 'Int!'>;
};

export class ReadonlyEntityAccessor<E extends EntityBase> {
    private queryMeta: QueryMeta<E>;
    private pkArgDef: string = '';
    private pkArgsAssign: string = '';

    protected itemName;
    protected listName;
    protected pluralTypeName;

    public constructor(protected typeName: string, private config: RepositoryConfig<E> = {}) {
        this.itemName = camelCase(this.typeName);
        this.listName = pluralize(this.itemName);
        this.pluralTypeName = pluralize(this.typeName);

        this.queryMeta = {
            filter: `${this.typeName}Filter!`,
            first: 'Int!',
            offset: 'Int!',
            orderBy: `[${this.pluralTypeName}OrderBy!]`,
            defaultFilter: config.defaultFilter,
        };
    }

    public createSelector<S1 extends FieldSelector<E, S1>>(s1: S1): NominalType<S1, E>;
    public createSelector<S1 extends FieldSelector<E, S1>, S2 extends FieldSelector<E, S2>>(
        s1: S1,
        s2: S2,
    ): NominalType<S1 & S2, E>;
    public createSelector<
        S1 extends FieldSelector<E, S1>,
        S2 extends FieldSelector<E, S2>,
        S3 extends FieldSelector<E, S3>
    >(s1: S1, s2: S2, s3: S3): NominalType<S1 & S2 & S3, E>;
    public createSelector<
        S1 extends FieldSelector<E, S1>,
        S2 extends FieldSelector<E, S2>,
        S3 extends FieldSelector<E, S3>
    >(s1?: S1, s2?: S2, s3?: S3): NominalType<S1 & S2 & S3, E> {
        const selector = deepmerge(this.ensureSelector(s1), this.ensureSelector(s2), this.ensureSelector(s3));
        return this.applyQueryMeta(selector);
    }

    public createQuery = <S extends FieldSelector<E, S>>(query: SelectQuery<E, S>): NominalType<S, E> => {
        return this.applyQueryMeta(query);
    };

    public createConnectionQuery = <S extends FieldSelector<EntityConnection<E>, S>>(
        query: ConnectionQuery<E, S>,
    ): NominalType<S, EntityConnection<E>> => {
        return this.applyQueryMeta(query);
    };

    protected getPkArg = (pk: InferPrimaryKey<E>) => {
        if (this.config?.pk) {
            return Object.entries(this.config.pk)
                .map(([name, type]) => `$${name}: ${type}`)
                .join(', ');
        }

        return Object.keys(pk)
            .map((x) => `$${x}: UUID!`)
            .join(', ');
    };

    private getPkArgImpl = (pk: InferPrimaryKey<E>) => {
        if (!this.pkArgDef) {
            this.pkArgDef = this.getPkArg(pk);
            this.pkArgsAssign = Object.keys(pk)
                .map((x) => `${x}: $${x}`)
                .join(', ');
        }

        return this.pkArgDef;
    };

    private applyQueryMeta = (obj: any) => {
        if (!obj || typeof obj !== 'object' || symbol in obj) {
            return;
        }

        obj[symbol] = this.queryMeta;

        return obj;
    };

    public find = <S extends FieldSelector<E, S>>(
        { gql }: GqlClient,
        query: SelectQuery<E, S>,
    ): Promise<Array<OriginInfer<E, S>>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${this.joinWithParentheses(varsDeclaration)} {
                items: ${this.listName + varsAssign + selector}
            }
        `;

        return gql(queryString, variables).then((x) => x.items as Array<OriginInfer<E, S>>);
    };

    public findAndCount = <S extends FieldSelector<E, S>>(
        { gql }: GqlClient,
        query: SelectQuery<E, S>,
    ): Promise<FindAndCountResult<E, S>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${this.joinWithParentheses(varsDeclaration)} {
                result: ${this.listName}Connection${varsAssign} {
                    items: nodes ${selector}
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as FindAndCountResult<E, S>);
    };

    public count = ({ gql }: GqlClient, query: Query<E> = {}): Promise<CountResult> => {
        const { varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${this.joinWithParentheses(varsDeclaration)} {
                result: ${this.listName}Connection${varsAssign} {
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as CountResult);
    };

    public findOne = <S extends FieldSelector<E, S>>(
        { gql }: GqlClient,
        query: FindOneQuery<E, S>,
    ): Promise<OriginInfer<E, S> | null> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery({ ...query, first: 1 });
        const queryString = `
            query${this.joinWithParentheses(varsDeclaration)} {
                items: ${this.listName + varsAssign + selector}
            }          
        `;

        return gql(queryString, variables).then((x) => (x.items[0] ?? null) as OriginInfer<E, S> | null);
    };

    public findOneOrError = async <S extends FieldSelector<E, S>>(
        client: GqlClient,
        query: FindOneQuery<E, S>,
    ): Promise<OriginInfer<E, S>> => {
        const res = await this.findOne(client, query);
        if (!res) {
            throw new NotFoundError('Not found');
        }

        return res;
    };

    public findByPk = <S extends FieldSelector<E, S> = []>(
        { gql }: GqlClient,
        query: ByPkQuery<E, S>,
    ): Promise<OriginInfer<E, S> | null> => {
        const { pk } = query;
        const { selector, varsDeclaration, variables } = this.prepareQuery(query);
        const queryString = `
            query${this.joinWithParentheses(varsDeclaration, this.getPkArgImpl(pk))} {
                item: ${this.itemName}(${this.pkArgsAssign}) ${selector}
            }
        `;

        return gql(queryString, {
            ...pk,
            ...variables,
        }).then((x) => (x.item ?? null) as OriginInfer<E, S> | null);
    };

    public findByPkOrError = async <S extends FieldSelector<E, S>>(
        client: GqlClient,
        query: ByPkQuery<E, S>,
    ): Promise<OriginInfer<E, S>> => {
        const res = await this.findByPk(client, query);
        if (!res) {
            throw new NotFoundError(`${this.typeName} not found`);
        }

        return res;
    };

    protected prepareQuery = (query: Partial<SelectQuery<E, any>>) => {
        this.applyQueryMeta(query);

        const ctx: PrepareQueryContext = {
            level: 0,
            variables: {},
            varsDeclaration: [],
        };

        const varsAssign = this.prepareQueryVars(ctx, query);

        return {
            selector: this.printFieldSelector(ctx, query.selector),
            varsDeclaration: ctx.varsDeclaration,
            varsAssign,
            variables: ctx.variables,
        };
    };

    private prepareQueryVars = (ctx: PrepareQueryContext, query: Partial<SelectQuery<E, any>>) => {
        const varsAssign: string[] = [];
        const queryMeta = (query as any)[symbol] as QueryMeta<any>;

        for (const key of knownQueryOptions.filter((x) => query[x] !== undefined)) {
            const name = key + '_' + ctx.level;

            ctx.varsDeclaration.push(`$${name}: ${queryMeta[key]}`);
            varsAssign.push(`${key}: $${name}`);

            if (key === 'orderBy') {
                ctx.variables[name] = query.orderBy!.map(
                    ([field, direction]) => constantCase(field as string) + '_' + direction,
                );
            } else if (key === 'filter') {
                ctx.variables[name] = queryMeta.defaultFilter
                    ? deepmerge(queryMeta.defaultFilter as any, query[key] as any)
                    : query[key];
            } else {
                ctx.variables[name] = query[key];
            }
        }

        if (varsAssign.length) {
            ctx.level++;
            return `(${varsAssign.join(', ')}) `;
        }

        return '';
    };

    private printFieldSelector = (ctx: PrepareQueryContext, query: any): string => {
        if (!query) {
            return '{ __typename }';
        }

        const varsAssign = !Array.isArray(query) && this.prepareQueryVars(ctx, query);
        if (varsAssign || 'selector' in query) {
            // query
            return varsAssign + this.printFieldSelector(ctx, query['selector']);
        } else {
            // selector
            let res = '{';
            if (Array.isArray(query)) {
                res += ' ' + query.join(', ') || '__typename';
            } else {
                for (const key in query) {
                    if (query[key] === true) {
                        res += ' ' + key;
                    } else {
                        res += ' ' + key + ' ' + this.printFieldSelector(ctx, query[key]);
                    }
                }
            }
            res += ' }';
            return res;
        }
    };

    protected joinWithParentheses = (ar: string[], rest?: string) => {
        if (rest) {
            ar.push(rest);
        }

        return ar.length ? `(${ar.join(', ')})` : '';
    };

    protected ensureSelector = (selector: any) => {
        if (Array.isArray(selector)) {
            return selector.reduce((acc, x) => {
                acc[x] = true;
                return acc;
            }, {});
        }

        return selector;
    };
}

export class EntityAccessor<E extends EntityBase> extends ReadonlyEntityAccessor<E> {
    public constructor(typeName: string, config?: RepositoryConfig<E>) {
        super(typeName, config);
    }

    public create = <S extends FieldSelector<E, S> = []>(
        { gql }: GqlClient,
        args: CreateMutation<E, S>,
    ): Promise<OriginInfer<E, S>> => {
        const { item } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${this.joinWithParentheses(varsDeclaration, `$item: ${this.typeName}Input!`)} {
                result: create${this.typeName}(input: { ${this.itemName}: $item }) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, {
            item,
            ...variables,
        }).then((x) => x.result.item as OriginInfer<E, S>);
    };

    public update = <S extends FieldSelector<E, S> = []>(
        { gql }: GqlClient,
        args: UpdateMutation<E, S>,
    ): Promise<OriginInfer<E, S>> => {
        const { pk, patch } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${this.joinWithParentheses(varsDeclaration, `$input: Update${this.typeName}Input!`)} {
                result: update${this.typeName}(input: $input) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, {
            input: {
                ...pk,
                patch: { ...(patch as any), updatedAt: new Date() },
            },
            ...variables,
        }).then((x) => x.result.item as OriginInfer<E, S>);
    };

    public delete = <S extends FieldSelector<E, S> = []>(
        { gql }: GqlClient,
        args: DeleteMutation<E, S>,
    ): Promise<OriginInfer<E, S>> => {
        const { pk } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${this.joinWithParentheses(varsDeclaration, `$input: Delete${this.typeName}Input!`)} {
                result: delete${this.typeName}(input: $input) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, {
            input: pk,
            ...variables,
        }).then((x) => x.result.item as OriginInfer<E, S>);
    };

    public findOneOrCreate = async <S extends FieldSelector<E, S>>(
        client: GqlClient,
        args: { filter: Filter<E>; selector: S; item: EntityCreate<E> },
    ): Promise<OriginInfer<E, S>> => {
        const { filter, selector, item } = args;
        const res = await this.findOne(client, { filter, selector });
        if (res) {
            return res;
        }

        return this.create(client, { item, selector });
    };

    public async updateOrCreate<S extends FieldSelector<E, S> = []>(
        client: GqlClient,
        args: {
            pk: InferPrimaryKey<E>;
            selector?: S;
            item: Omit<EntityCreate<E>, keyof InferPrimaryKey<E>>;
            patch?: EntityPatch<E>;
        },
    ): Promise<OriginInfer<E, S>> {
        const { patch, pk, selector, item } = args;
        const res = await this.findByPk(client, { pk, selector });

        return res
            ? this.update(client, { pk, patch: (patch ?? item) as any, selector })
            : this.create(client, { item: { ...item, ...pk } as any, selector });
    }
}

export class NotFoundError extends Error {
    public constructor(message: string) {
        super(message);
    }
}
