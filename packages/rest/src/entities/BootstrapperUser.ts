import { Permission } from '@flstk/rest/security';

export type BootstrapperUser = {
    id: string;
    name: string | null;
    permissions: Permission[];
    bannedAt: Date | null;
};
