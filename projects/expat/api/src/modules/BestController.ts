import { z, ZodType } from 'zod';

class Controller<TContext, S extends string> {
    protected endpoint = <TInput extends ZodType<any>, TOutput>(def: {
        input?: TInput;
        resolve: (args: { input: z.infer<TInput>, ctx: TContext }) => TOutput | Promise<TOutput>;
    }) => {};
}

type Context = { user: { id: string } };

class ApiController<S extends string> extends Controller<Context, S> {}

export class BestController extends ApiController<'translate'> {
    public constructor() {
        super();
    }

    public ['/'] = this.endpoint({
        input: z.string(),
        resolve: ({ input, ctx }) => {
            return {
                id: 213,
                value: new Date(),
            }
        },
    });
}

