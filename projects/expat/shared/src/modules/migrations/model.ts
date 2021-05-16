import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class MigrationVm {
    @Field()
    public name!: string;

    @Field()
    public migratedAt!: Date;
}
