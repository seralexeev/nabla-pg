import { Pg } from '@flstk/pg/db';
import { Migrations } from '@projects/expat/shared/entities/generated';
import { MigrationVm } from '@projects/expat/shared/modules/migrations/model';
import { Arg, Query, Resolver } from 'type-graphql';

@Resolver()
export class MigrationResolver {
    public constructor(private pg: Pg) {}

    @Query(() => [MigrationVm])
    public async allMigrations(@Arg('id') id: string) {
        return Migrations.find(this.pg, {
            selector: ['name', 'migratedAt'],
        });
    }
}
