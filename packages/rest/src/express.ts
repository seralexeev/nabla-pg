import { RequestHandler } from 'express';
import { reduceByKey } from '@nabla/utils';

type UseControllersConfig = {
    controllers: any[];
    container: {
        resolve: (type: any) => any;
    };
};

const useControllers = (config: UseControllersConfig): RequestHandler => {
    const { container, controllers } = config;
    // const instances = reduceByKey(controllers, x => x);

    return (req, res, next) => {};
};
