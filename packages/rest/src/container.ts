import { DependencyContainer } from 'tsyringe';

export class Container {
    public resolve: DependencyContainer['resolve'];
    public resolveAll: DependencyContainer['resolveAll'];

    public constructor(public container: DependencyContainer) {
        this.resolve = container.resolve.bind(container);
        this.resolveAll = container.resolveAll.bind(container);
    }
}
