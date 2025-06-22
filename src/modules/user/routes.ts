import { RouteOption, TagOption } from '../restful/types';

import * as controllers from './controllers';

export function createUserApi() {
    const routes: Record<'app', RouteOption[]> = {
        app: [
            {
                name: 'app.user',
                path: 'user',
                controllers: Object.values(controllers),
            },
        ],
    };

    const tags: Record<'app', (string | TagOption)[]> = {
        app: [
            { name: '用户管理', description: '对用户进行CRUD操作' },
            { name: '账户操作', description: '注册登录、查看修改账户信息、修改密码等' },
        ],
    };

    return { routes, tags };
}
