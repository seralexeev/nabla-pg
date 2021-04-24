export const symbol = Symbol('ControllerMetadata');
export interface ControllerMetadata {
    [symbol]: {
        path: string;
        params: {
            [key: string]: ParamConfig[];
        };
    };
}

type ParamConfig = {
    index: number;
    type: 'body';
};

const getMeta = (target: any) => {
    const controller = target as ControllerMetadata;
    if (!controller[symbol]) {
        controller[symbol] = {
            path: '',
            params: {},
        };
    }

    return controller;
};

export const Controller = (path = ''): ClassDecorator => {
    return (target: Function) => {
        const controller = getMeta(target.prototype);
        controller[symbol].path = path;
    };
};

export const Body = (): ParameterDecorator => {
    return (target: object, method: string | symbol, index: number) => {
        const controller = getMeta(target);
        controller[symbol].params[String(method)].push({ index, type: 'body' });
    };
};
