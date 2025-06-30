import { RouteOption, TagOption } from '../restful/types';

import * as controllers from './controllers';
import * as managerControllers from './controllers/manager';

export function createUserApi() {
    const routes: Record<'app' | 'manager', RouteOption[]> = {
        app: [
            {
                name: 'app.user',
                path: 'user',
                controllers: Object.values(controllers),
            },
        ],
        manager: [
            {
                name: 'app.user',
                path: 'manager',
                controllers: Object.values(managerControllers),
            },
        ],
    };

    const tags: Record<'app' | 'manager', (string | TagOption)[]> = {
        app: [
            { name: '用户管理', description: '对用户进行CRUD操作' },
            { name: '账户操作', description: '注册登录、查看修改账户信息、修改密码等' },
        ],
        manager: [{ name: '用户管理', description: '管理用户信息' }],
    };

    return { routes, tags };
}
