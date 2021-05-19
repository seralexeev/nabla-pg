export const checkPermission = (self: Permission[], required: Permission): boolean => {
    if (self.includes('*') || required === '*') {
        return true;
    }
    if (required.endsWith('*')) {
        const namespace = required.slice(0, required.length - 2);
        const index = self.findIndex((x) => x.startsWith(namespace));
        return index !== -1;
    }

    return self.findIndex((x) => x === required) !== -1;
};

/**
 * validatePermissions(a, b) --> a OR b
 *
 * validatePermissions([a,c], b) --> a AND c OR b
 */
export const validatePermissions = (self: Permission[], permissions: PermissionsOptions) => {
    return permissions
        .map((x) => (typeof x === 'string' ? [x] : x))
        .some((x) => x.every((p) => checkPermission(self, p)));
};

export type PermissionsOptions = Array<Permission | Permission[]>;
export const permissions = ['*', 'client.*', 'internal.*'] as const;
export type Permission = typeof permissions[number];

