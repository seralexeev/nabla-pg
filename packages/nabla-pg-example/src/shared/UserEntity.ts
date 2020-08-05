import { EntityBase, IdPkey, ReadonlyValue } from '../../../nabla-pg-core/src/entity';
import { EntityAccessor } from '../../../nabla-pg-core/src/EntityAccessor';

export type UserEntity = EntityBase<'User', IdPkey> & {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: ReadonlyValue<string>;
};

export const Users = new EntityAccessor<UserEntity>('User');
