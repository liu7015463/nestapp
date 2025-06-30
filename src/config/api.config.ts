import { Configure } from '@/modules/config/configure';
import { ConfigureFactory } from '@/modules/config/types';
import { createContentApi } from '@/modules/content/routes';
import { createRbacApi } from '@/modules/rbac/routes';
import { ApiConfig, VersionOption } from '@/modules/restful/types';
import { createUserApi } from '@/modules/user/routes';

export const v1 = async (configure: Configure): Promise<VersionOption> => {
    const contentApi = createContentApi();
    const userApi = createUserApi();
    const rbacApi = createRbacApi();
    return {
        routes: [
            {
                name: 'app',
                path: '/',
                controllers: [],
                doc: {
                    description: 'app name desc',
                    tags: [...contentApi.tags.app, ...rbacApi.tags.app, ...userApi.tags.app],
                },
                children: [...contentApi.routes.app, ...rbacApi.routes.app, ...userApi.routes.app],
            },
            {
                name: 'manager',
                path: 'manager',
                controllers: [],
                doc: {
                    description: '后台管理接口',
                    tags: [
                        ...contentApi.tags.manager,
                        ...rbacApi.tags.manager,
                        ...userApi.tags.manager,
                    ],
                },
                children: [
                    ...contentApi.routes.manager,
                    ...rbacApi.routes.manager,
                    ...userApi.routes.manager,
                ],
            },
        ],
    };
};

export const api: ConfigureFactory<ApiConfig> = {
    register: async (configure: Configure) => ({
        title: configure.env.get('API_TITLE', `${await configure.get<string>('app.name')} API`),
        auth: true,
        docuri: 'api/docs',
        default: configure.env.get('API_DEFAULT_VERSION', 'v1'),
        enabled: [],
        versions: { v1: await v1(configure) },
    }),
};
