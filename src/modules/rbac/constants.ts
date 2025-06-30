export enum SystemRoles {
    USER = 'user',
    SUPER_ADMIN = 'super_admin',
}

export const SYSTEM_PERMISSION = 'system-manage';

export const PERMISSION_CHECKERS = 'permission_checkers';

export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    MANAGE = 'manage',
    OWNER = 'owner',
}
