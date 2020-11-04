import { camelCase, merge, snakeCase, toUpper } from 'lodash';
import pluralize from 'pluralize';
import {
    ConnectionQuery,
    EntityBase,
    EntityConnection,
    EntityCreate,
    EntityPatch,
    FieldSelector,
    Filter,
    FindOptions,
    NominalType,
    OriginInfer,
    PrimaryKey,
    Query,
} from './entity';
import { NotFoundError } from './errors';
import { GqlInvoke } from './gql';

const OPT_TYPES = 'OPT_TYPES';

export type FindAndCountResult<E extends EntityBase, F extends FieldSelector<E, F>> = {
    items: Array<OriginInfer<E, F>>;
    total: number;
};

export type CountResult = {
    total: number;
};

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

    public constructor(private typeName: string, defaultFilter?: Filter<E>) {
        this.optTypes = {
            filter: `${this.typeName}Filter!`,
            first: 'Int!',
            offset: 'Int!',
            orderBy: `[${this.pluralTypeName}OrderBy!]`,
            defaultFilter,
        };
    }

    public createSelector<F1 extends FieldSelector<E, F1>>(s1: F1): NominalType<F1, E>;
    public createSelector<F1 extends FieldSelector<E, F1>, F2 extends FieldSelector<E, F2>>(
        s1: F1,
        s2: F2,
    ): NominalType<F1 & F2, E>;
    public createSelector<
        F1 extends FieldSelector<E, F1>,
        F2 extends FieldSelector<E, F2>,
        F3 extends FieldSelector<E, F3>
    >(s1: F1, s2: F2, s3: F3): NominalType<F1 & F2 & F3, E>;
    public createSelector<
        F1 extends FieldSelector<E, F1>,
        F2 extends FieldSelector<E, F2>,
        F3 extends FieldSelector<E, F3>
    >(s1?: F1, s2?: F2, s3?: F3): NominalType<F1 & F2 & F3, E> {
        const selector = merge({}, ensureSelector(s1), ensureSelector(s2), ensureSelector(s3));
        this.applyOptTypes(selector);
        return selector as any;
    }

    public createQuery = <F extends FieldSelector<E, F>>(query: Query<E, F>): NominalType<F, E> => {
        this.applyOptTypes(query);
        return query as any;
    };

    public createConnectionQuery = <F extends FieldSelector<EntityConnection<E>, F>>(
        query: ConnectionQuery<E, F>,
    ): NominalType<F, EntityConnection<E>> => {
        this.applyOptTypes(query);
        return query as any;
    };

    protected getPkArg = (pk: PrimaryKey<E>) => {
        return Object.keys(pk)
            .map((x) => `$${x}: UUID!`)
            .join(', ');
    };

    private getPkArgImpl = (pk: PrimaryKey<E>) => {
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

    private get listName() {
        return pluralize(this.itemName);
    }

    private get pluralTypeName() {
        return pluralize(this.typeName);
    }

    private prepareQuery = (query: Partial<Query<any, any>>) => {
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

    public find = <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        query: Query<E, F>,
    ): Promise<Array<OriginInfer<E, F>>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const declStr = varsDeclaration.length ? `(${varsDeclaration.join(', ')})` : '';

        const queryString = `
            query${declStr} {
                items: ${this.listName + varsAssign + selector}
            }
        `;

        return gql(queryString, variables).then((x) => x.items as Array<OriginInfer<E, F>>);
    };

    public findAndCount = <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        query: Query<E, F>,
    ): Promise<FindAndCountResult<E, F>> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const declStr = varsDeclaration.length ? `(${varsDeclaration.join(', ')})` : '';

        const queryString = `
            query${declStr} {
                result: ${this.listName}Connection${varsAssign} {
                    items: nodes ${selector}
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as FindAndCountResult<E, F>);
    };

    public count = (gql: GqlInvoke, query: FindOptions<E>): Promise<CountResult> => {
        const { varsDeclaration, variables, varsAssign } = this.prepareQuery(query);
        const declStr = varsDeclaration.length ? `(${varsDeclaration.join(', ')})` : '';

        const queryString = `
            query${declStr} {
                result: ${this.listName}Connection${varsAssign} {
                    total: totalCount
                }
            }
        `;

        return gql(queryString, variables).then((x) => x.result as CountResult);
    };

    public findOne = <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        args: { selector: F; filter: Filter<E> },
    ): Promise<OriginInfer<E, F> | null> => {
        const { selector, varsDeclaration, variables, varsAssign } = this.prepareQuery(args);
        const declStr = varsDeclaration.length ? `(${varsDeclaration.join(', ')})` : '';
        const queryString = `
            query${declStr} {
                items: ${this.listName + varsAssign + selector}
            }          
        `;

        return gql(queryString, variables).then((x) => (x.items[0] ?? null) as OriginInfer<E, F> | null);
    };

    public findOneOrError = async <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        args: { filter: Filter<E>; selector: F },
    ): Promise<OriginInfer<E, F>> => {
        const res = await this.findOne(gql, args);
        if (!res) {
            throw new NotFoundError(`${this.typeName} not found`);
        }

        return res;
    };

    public findByPk = <F extends FieldSelector<E, F> = []>(
        gql: GqlInvoke,
        args: { pk: PrimaryKey<E>; selector?: F },
    ): Promise<OriginInfer<E, F> | null> => {
        const { pk } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const declStr = `(${[this.getPkArgImpl(pk), ...varsDeclaration].join(', ')})`;

        const queryString = `
            query${declStr} {
                item: ${this.itemName}(${this.pkArgsAssign}) ${selector}
            }
        `;

        return gql(queryString, {
            ...pk,
            ...variables,
        }).then((x) => (x.item ?? null) as OriginInfer<E, F> | null);
    };

    public findByPkOrError = async <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        args: { pk: PrimaryKey<E>; selector: F },
    ): Promise<OriginInfer<E, F>> => {
        const res = await this.findByPk(gql, args);
        if (!res) {
            throw new NotFoundError(`${this.typeName} not found`);
        }

        return res;
    };

    public create = <F extends FieldSelector<E, F> = []>(
        gql: GqlInvoke,
        args: { item: EntityCreate<E>; selector?: F },
    ): Promise<OriginInfer<E, F>> => {
        const { item } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const declStr = `(${[`$item: ${this.typeName}Input!`, ...varsDeclaration].join(', ')})`;
        const queryString = `
            mutation${declStr} {
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
        gql: GqlInvoke,
        args: { pk: PrimaryKey<E>; patch: EntityPatch<E, PrimaryKey<E>>; selector?: F },
    ): Promise<OriginInfer<E, F>> => {
        const { pk, patch } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const declStr = `(${[`$input: Update${this.typeName}Input!`, ...varsDeclaration].join(', ')})`;

        const queryString = `
            mutation${declStr} {
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
        gql: GqlInvoke,
        args: { pk: PrimaryKey<E>; selector?: F },
    ): Promise<OriginInfer<E, F>> => {
        const { pk } = args;
        const { selector, varsDeclaration, variables } = this.prepareQuery(args);
        const declStr = `(${[`$input: Delete${this.typeName}Input!`, ...varsDeclaration].join(', ')})`;
        const queryString = `
            mutation${declStr} {
                result: delete${this.typeName}(input: $input) {
                    item: ${this.itemName} ${selector}
                }
            }
        `;

        return gql(queryString, { input: pk, ...variables }).then((x) => x.result.item as OriginInfer<E, F>);
    };

    public findOneOrCreate = async <F extends FieldSelector<E, F>>(
        gql: GqlInvoke,
        args: { filter: Filter<E>; selector: F; item: EntityCreate<E> },
    ): Promise<OriginInfer<E, F>> => {
        const { filter, selector, item } = args;
        const res = await this.findOne(gql, { filter, selector });
        if (res) {
            return res;
        }

        return await this.create(gql, { item, selector });
    };

    public updateOrCreate = async <F extends FieldSelector<E, F> = []>(
        gql: GqlInvoke,
        args: {
            pk: PrimaryKey<E>;
            selector?: F;
            item: EntityCreate<E>;
            patch?: EntityPatch<E, PrimaryKey<E>>;
        },
    ): Promise<OriginInfer<E, F>> => {
        const { patch, ...rest } = args;
        let res = await this.findByPk(gql, rest);
        if (!res) {
            res = await this.create(gql, rest);
        } else if (patch) {
            res = await this.update(gql, { ...rest, patch });
        }

        return res;
    };

    private prepareQueryVars = (ctx: PrepareQueryContext, query: Partial<Query<any, any>>) => {
        const varsAssign: string[] = [];
        const optTypes = (query as any)[OPT_TYPES] as OptTypes<any>;

        for (const key of knownQueryOptions.filter((x) => query[x] !== undefined)) {
            const name = key + '_' + ctx.level;

            ctx.varsDeclaration.push(`$${name}: ${optTypes[key]}`);
            varsAssign.push(`${key}: $${name}`);

            if (key === 'orderBy') {
                ctx.variables[name] = query.orderBy!.map(
                    ([field, direction]) => toUpper(snakeCase(field as string)) + '_' + direction,
                );
            } else if (key === 'filter') {
                ctx.variables[name] = optTypes.defaultFilter
                    ? merge({}, optTypes.defaultFilter, query[key])
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

const ensureSelector = (selector: any) => {
    if (Array.isArray(selector)) {
        return selector.reduce((acc, x) => {
            acc[x] = true;
            return acc;
        }, {});
    }

    return selector;
};
