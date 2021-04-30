import { EntityBase, EntityConnection, IdPkey } from '@flstk/pg-core/entity';
import { EntityAccessor } from '@flstk/pg-core/EntityAccessor';
import { Pg } from '@flstk/pg/db';
import { describe, expect, it } from '@jest/globals';

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
    const pg: Pg = null!;

    const ss = pg.transaction(async (t) => {
        return t.savepoint(async (t) => {
            return 2;
        });
    });

    const [res] = await Entities.find(null!, {
        selector: {
            id: true,
        },
    });
};

describe('selectors', () => {
    it('should compile without errors', () => {
        expect(true).toEqual(true);
    });
});
