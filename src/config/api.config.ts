import { Configure } from '@/modules/config/configure';
import { ConfigureFactory } from '@/modules/config/types';
import * as contentControllers from '@/modules/content/controllers';
import { ApiConfig, VersionOption } from '@/modules/restful/types';
import { createUserApi } from '@/modules/user/routes';

export const v1 = async (configure: Configure): Promise<VersionOption> => {
    const userApi = createUserApi();
    return {
        routes: [
            {
                name: 'app',
                path: '/',
                controllers: [],
                doc: {
                    description: 'app name desc',
                    tags: [
                        { name: '分类操作', description: '对分类进行CRUD操作' },
                        { name: '标签操作', description: '对标签进行CRUD操作' },
                        { name: '文章操作', description: '对文章进行CRUD操作' },
                        { name: '评论操作', description: '对评论进行CRUD操作' },
                        ...userApi.tags.app,
                    ],
                },
                children: [
                    {
                        name: 'app.content',
                        path: 'content',
                        controllers: Object.values(contentControllers),
                    },
                    ...userApi.routes.app,
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
