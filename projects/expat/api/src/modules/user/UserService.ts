import { Pg } from '@flstk/pg';
import { Users } from '@projects/expat/shared/entities/generated';
import { singleton } from 'tsyringe';

@singleton()
export class UserService {
    public constructor(private pg: Pg) {}

    public getAppUser = (id: string) => {
        return Users.findByPkOrError(this.pg, {
            pk: { id },
            selector: {
                id: true,
                email: true,
                name: true,
            },
        });
    };
}
