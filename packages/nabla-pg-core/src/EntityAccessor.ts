import { camelCase } from 'camel-case';
import { constantCase } from 'constant-case';
import deepmerge from 'deepmerge';
import pluralize from 'pluralize';
import { EntityBase, EntityConnection, EntityCreate, EntityPatch, InferPrimaryKey } from './entity';
import { Filter } from './filter';
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
} from './query';
import { FieldSelector, OriginInfer } from './selector';
import { NominalType } from './types';

const OPT_TYPES = '__OPT_TYPES';

const knownQueryOptions = ['filter', 'first', 'offset', 'orderBy'] as const;
type VariableKeys = typeof knownQueryOptions[number];

type PrepareQueryContext = {
    varsDeclaration: string[];
    variables: any;
    level: number;
};

type OptTypes<E> = Record<VariableKeys, string> & {
    defaultFilter?: Filter<E>;
};

export class EntityAccessor<E extends EntityBase> {
    private optTypes: OptTypes<E>;
    private pkArgDef: string = '';
    private pkArgsAssign: string = '';

    public constructor(
        private typeName: string,
        private params: {
            defaultFilter?: Filter<E>;
            pkDef?: Record<keyof InferPrimaryKey<E>, 'UUID!' | 'String!' | 'Int!'>;
        } = {},
    ) {
        this.optTypes = {
            filter: `${this.typeName}Filter!`,
            first: 'Int!',
            offset: 'Int!',
            orderBy: `[${this.pluralTypeName}OrderBy!]`,
            defaultFilter: params.defaultFilter,
        };
    }

    public createSelector<S1 extends FieldSelector<E, S1>>(s1: S1): NominalType<S1, E>;
    public createSelector<S1 extends FieldSelector<E, S1>, F2 extends FieldSelector<E, S1>>(
        s1: S1,
        s2: F2,
    ): NominalType<S1 & F2, E>;
    public createSelector<
        S1 extends FieldSelector<E, S1>,
        S2 extends FieldSelector<E, S2>,
        S3 extends FieldSelector<E, S3>
    >(s1: S1, s2: S2, s3: S3): NominalType<S1 & S2 & S3, E>;
    public createSelector<
        F1 extends FieldSelector<E, F1>,
        F2 extends FieldSelector<E, F2>,
        F3 extends FieldSelector<E, F3>
    >(s1?: F1, s2?: F2, s3?: F3): NominalType<F1 & F2 & F3, E> {
        const selector = deepmerge(ensureSelector(s1), ensureSelector(s2), ensureSelector(s3));
        this.applyOptTypes(selector);
        return selector as any;
    }

    public createQuery = <F extends FieldSelector<E, F>>(query: SelectQuery<E, F>): NominalType<F, E> => {
        this.applyOptTypes(query);
        return query as any;
    };

    public createConnectionQuery = <F extends FieldSelector<EntityConnection<E>, F>>(
        query: ConnectionQuery<E, F>,
    ): NominalType<F, EntityConnection<E>> => {
        this.applyOptTypes(query);
        return query as any;
    };

    protected getPkArg = (pk: InferPrimaryKey<E>) => {
        if (this.params?.pkDef) {
            return Object.entries(this.params.pkDef)
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

    private applyOptTypes = (obj: any) => {
        if (!obj || typeof obj !== 'object' || OPT_TYPES in obj) {
            return;
        }

        obj[OPT_TYPES] = this.optTypes;
    };

    private get itemName() {
        return camelCase(this.typeName);
    }

    protected get listName() {
        return pluralize(this.itemName);
    }

    protected get pluralTypeName() {
        return pluralize(this.typeName);
    }

    private prepareQuery = (query: Partial<SelectQuery<E, any>>) => {
        this.applyOptTypes(query);

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

    public find = <S extends FieldSelector<E, S>>(
        { gql }: GqlClient,
        query: SelectQuery<E, S>,
    ): Promise<Array<OriginInfer<E, S>>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${joinWithParentheses(varsDeclaration)} {
                items: ${this.listName + varsAssign + selector}
            }
        `;

        return gql(queryString, variables).then((x) => x.items as Array<OriginInfer<E, S>>);
    };

    public findAndCount = <F extends FieldSelector<E, F>>(
        { gql }: GqlClient,
        query: SelectQuery<E, F>,
    ): Promise<FindAndCountResult<E, F>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${joinWithParentheses(varsDeclaration)} {
                result: ${this.listName}Connection${varsAssign} {
                    items: nodes ${selector}
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as FindAndCountResult<E, F>);
    };

    public count = ({ gql }: GqlClient, query: Query<E> = {}): Promise<CountResult> => {
        const { varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const queryString = `
            query${joinWithParentheses(varsDeclaration)} {
                result: ${this.listName}Connection${varsAssign} {
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as CountResult);
    };

    public findOne = <F extends FieldSelector<E, F>>(
        { gql }: GqlClient,
        query: FindOneQuery<E, F>,
    ): Promise<OriginInfer<E, F> | null> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery({ ...query, first: 1 });
        const queryString = `
            query${joinWithParentheses(varsDeclaration)} {
                items: ${this.listName + varsAssign + selector}
            }          
        `;

        return gql(queryString, variables).then((x) => (x.items[0] ?? null) as OriginInfer<E, F> | null);
    };

    public findOneOrError = async <F extends FieldSelector<E, F>>(
        client: GqlClient,
        query: FindOneQuery<E, F>,
    ): Promise<OriginInfer<E, F>> => {
        const res = await this.findOne(client, query);
        if (!res) {
            throw new Error('Not found');
        }

        return res;
    };

    public findByPk = <F extends FieldSelector<E, F> = []>(
        { gql }: GqlClient,
        query: ByPkQuery<E, F>,
    ): Promise<OriginInfer<E, F> | null> => {
        const { pk } = query;
        const { selector, varsDeclaration, variables } = this.prepareQuery(query);
        const queryString = `
            query${joinWithParentheses(varsDeclaration, this.getPkArgImpl(pk))} {
                item: ${this.itemName}(${this.pkArgsAssign}) ${selector}
            }
        `;

        return gql(queryString, {
            ...pk,
            ...variables,
        }).then((x) => (x.item ?? null) as OriginInfer<E, F> | null);
    };

    public findByPkOrError = async <F extends FieldSelector<E, F>>(
        client: GqlClient,
        query: ByPkQuery<E, F>,
    ): Promise<OriginInfer<E, F>> => {
        const res = await this.findByPk(client, query);
        if (!res) {
            throw new Error(`${this.typeName} not found`);
        }

        return res;
    };

    public create = <F extends FieldSelector<E, F> = []>(
        { gql }: GqlClient,
        args: CreateMutation<E, F>,
    ): Promise<OriginInfer<E, F>> => {
        const { item } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${joinWithParentheses(varsDeclaration, `$item: ${this.typeName}Input!`)} {
                result: create${this.typeName}(input: { ${this.itemName}: $item }) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, {
            item,
            ...variables,
        }).then((x) => x.result.item as OriginInfer<E, F>);
    };

    public update = <F extends FieldSelector<E, F> = []>(
        { gql }: GqlClient,
        args: UpdateMutation<E, F>,
    ): Promise<OriginInfer<E, F>> => {
        const { pk, patch } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${joinWithParentheses(varsDeclaration, `$input: Update${this.typeName}Input!`)} {
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
        }).then((x) => x.result.item as OriginInfer<E, F>);
    };

    public delete = <F extends FieldSelector<E, F> = []>(
        { gql }: GqlClient,
        args: DeleteMutation<E, F>,
    ): Promise<OriginInfer<E, F>> => {
        const { pk } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const queryString = `
            mutation${joinWithParentheses(varsDeclaration, `$input: Delete${this.typeName}Input!`)} {
                result: delete${this.typeName}(input: $input) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, { input: pk, ...variables }).then((x) => x.result.item as OriginInfer<E, F>);
    };

    public findOneOrCreate = async <F extends FieldSelector<E, F>>(
        client: GqlClient,
        args: { filter: Filter<E>; selector: F; item: EntityCreate<E> },
    ): Promise<OriginInfer<E, F>> => {
        const { filter, selector, item } = args;
        const res = await this.findOne(client, { filter, selector });
        if (res) {
            return res;
        }

        return this.create(client, { item, selector });
    };

    public async updateOrCreate<F extends FieldSelector<E, F> = []>(
        client: GqlClient,
        args: {
            pk: InferPrimaryKey<E>;
            selector?: F;
            item: Omit<EntityCreate<E>, keyof InferPrimaryKey<E>>;
            patch?: EntityPatch<E>;
        },
    ): Promise<OriginInfer<E, F>> {
        const { patch, pk, selector, item } = args;
        const res = await this.findByPk(client, { pk, selector });

        return res
            ? this.update(client, { pk, patch: (patch ?? item) as any, selector })
            : this.create(client, { item: { ...item, ...pk } as any, selector });
    }

    private prepareQueryVars = (ctx: PrepareQueryContext, query: Partial<SelectQuery<E, any>>) => {
        const varsAssign: string[] = [];
        const optTypes = (query as any)[OPT_TYPES] as OptTypes<any>;

        for (const key of knownQueryOptions.filter((x) => query[x] !== undefined)) {
            const name = key + '_' + ctx.level;

            ctx.varsDeclaration.push(`$${name}: ${optTypes[key]}`);
            varsAssign.push(`${key}: $${name}`);

            if (key === 'orderBy') {
                ctx.variables[name] = query.orderBy!.map(
                    ([field, direction]) => constantCase(field as string) + '_' + direction,
                );
            } else if (key === 'filter') {
                ctx.variables[name] = optTypes.defaultFilter
                    ? deepmerge(optTypes.defaultFilter as any, query[key] as any)
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
                    if (key === OPT_TYPES) {
                        continue;
                    }

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
}

const joinWithParentheses = (ar: string[], rest?: string) => {
    if (rest) {
        ar.push(rest);
    }

    return ar.length ? `(${ar.join(', ')})` : '';
};

const ensureSelector = (selector: any) => {
    if (Array.isArray(selector)) {
        return selector.reduce((acc, x) => {
            acc[x] = true;
            return acc;
        }, {});
    }

    return selector;
};
