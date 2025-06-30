import { RouteOption, TagOption } from '@/modules/restful/types';

import * as controllers from './controllers';
import * as manageControllers from './controllers/manager';

export const createRbacApi = () => {
    const routes: Record<'app' | 'manager', RouteOption[]> = {
        app: [
            {
                name: 'app.rbac',
                path: 'rbac',
                controllers: Object.values(controllers),
            },
        ],
        manager: [
            {
                name: 'manage.rbac',
                path: 'rbac',
                controllers: Object.values(manageControllers),
            },
        ],
    };
    const tags: Record<'app' | 'manager', Array<string | TagOption>> = {
        app: [{ name: '角色查询', description: '查询角色信息' }],
        manager: [
            { name: '角色管理', description: '管理角色信息' },
            { name: '权限信息', description: '查询权限信息' },
        ],
    };
    return { routes, tags };
};
