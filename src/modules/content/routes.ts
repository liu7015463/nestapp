import { RouteOption, TagOption } from '@/modules/restful/types';

import * as controllers from './controllers';
import * as manageControllers from './controllers/manager';

export const createContentApi = () => {
    const routes: Record<'app' | 'manager', RouteOption[]> = {
        app: [
            {
                name: 'app.content',
                path: 'content',
                controllers: Object.values(controllers),
            },
        ],
        manager: [
            {
                name: 'manage.content',
                path: 'content',
                controllers: Object.values(manageControllers),
            },
        ],
    };
    const tags: Record<'app' | 'manager', Array<string | TagOption>> = {
        app: [
            { name: '分类查询', description: '查询分类信息' },
            { name: '标签查询', description: '查询标签信息' },
            {
                name: '文章操作',
                description: '查询文章以及对自己的文章进行CRUD操作',
            },
            {
                name: '评论操作',
                description: '查看评论以及对自己的评论进行CRD操作',
            },
        ],
        manager: [
            { name: '分类管理', description: '管理分类信息' },
            { name: '标签管理', description: '管理标签信息' },
            { name: '文章管理', description: '管理文章信息' },
            { name: '评论管理', description: '管理评论信息' },
        ],
    };
    return { routes, tags };
};
