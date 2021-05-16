/**
 * This file was auto-generated please do not modify it!
 */

import type { EntityBase } from '@flstk/pg-core';
import { EntityAccessor } from '@flstk/pg-core';

export type MigrationEntity = EntityBase<{ name: string }> & {
    migratedAt: Date | null;
}

export const Migrations = new EntityAccessor<MigrationEntity>('Migration', { pk: { name: 'String!' } });
