import { z, ZodType } from 'zod';
import { Request, Express } from 'express';
import { Class } from '@flstk/utils';

type Context = { user: { id: string } };

class EndpointFactory {
    public constructor(private app: Express) {}

    public register = (def: { input?: any; resolve: (args: { input: any; ctx: Context }) => any }) => {
        this.app.use();
    };
}

const s = Symbol('endpoint');

const endpoint = <TInput extends ZodType<any>, TOutput>(def: {
    input?: TInput;
    resolve: (args: { input: z.infer<TInput>; ctx: Context }) => TOutput | Promise<TOutput>;
}) => {
    return {
        [s]: def,
    };
};

type EndpointMeta = {
    [s]: {
        input?:  ZodType<any>;
        resolve: (args: { input: z.infer<any>; ctx: Context }) => any;
    };
};

export class BestController {
    public constructor() {}

    public ['/'] = endpoint({
        input: z.string(),
        resolve: ({ input, ctx }) => {
            return {
                id: 213,
                value: new Date(),
            };
        },
    });
}

const isEndpoint = (value: any): value is EndpointMeta => s in value;

const makeMiddleware = (app: Express, type: BestController) => {
    for (const [name, value] of Object.entries(type)) {
        if (!isEndpoint(value)) {
            return;
        }

        const { resolve, input: inputDef } = value[s];
        app.use(name, async (req, res, next) => {
            try {
                const input = inputDef ? inputDef.parse(req.body) : undefined;
                await resolve()
            } catch (e) {
                next(e);
            }
        });

        console.log(def);
    }
};

makeMiddleware(new BestController());
