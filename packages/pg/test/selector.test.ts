import { EntityBase, EntityConnection, IdPkey } from '@flstk/pg/entity';
import { EntityAccessor } from '@flstk/pg/EntityAccessor';

type Entity = EntityBase<IdPkey> & {
    string: string;
    stringOrNull: string | null;

    stringLiteral: 'a' | 'b';
    stringLiteralOrNull: 'a' | 'b' | null;

    numberLiteral: 0 | 1;
    numberLiteralOrNull: 0 | 1 | null;

    number: number;
    numberOrNull: number | null;

    date: Date;
    dateOrNull: Date | null;

    boolean: boolean;
    booleanOrNull: boolean | null;

    array: string[];
    arrayOrNull: string[] | null;

    any: any;
    unknown: unknown;

    entity: Entity;
    entityOrNull: Entity | null;

    entityArray: Entity[];

    entityConnection: EntityConnection<Entity>;
    selector: string;
};

const Entities = new EntityAccessor<Entity>('User');

async () => {
    const [res] = await Entities.find(null!, {
        selector: {
            id: true,
        },
    });
};
