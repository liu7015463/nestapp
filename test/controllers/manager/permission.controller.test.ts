import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CommentEntity } from '@/modules/content/entities';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionAction } from '@/modules/rbac/constants';
import { PermissionEntity } from '@/modules/rbac/entities';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/rbac';

describe('PermissionController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let permissionRepository: PermissionRepository;
    let userRepository: UserRepository;
    let testPermissions: PermissionEntity[];
    let adminUser: UserEntity;
    let authToken: string;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        permissionRepository = app.get<PermissionRepository>(PermissionRepository);
        userRepository = app.get<UserRepository>(UserRepository);
        datasource = app.get<DataSource>(DataSource);

        if (!datasource.isInitialized) {
            await datasource.initialize();
        }

        // 创建测试数据
        await setupTestData();
    });

    afterAll(async () => {
        // 清理测试数据
        await cleanupTestData();
        await datasource.destroy();
        await app.close();
    });

    async function setupTestData() {
        // 创建管理员用户
        const permission = await permissionRepository.findOneOrFail({
            where: { name: 'system-manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_permission_manager',
            nickname: 'Admin Permission Manager',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_permission_manager',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试权限数据
        const permission1 = await permissionRepository.save({
            name: 'Manager Test Permission 1',
            label: 'manager.test.permission.1',
            description: 'Manager test permission description 1',
            rule: {
                action: PermissionAction.MANAGE,
                subject: CommentEntity,
            },
        });

        const permission2 = await permissionRepository.save({
            name: 'Manager Test Permission 2',
            label: 'manager.test.permission.2',
            description: 'Manager test permission description 2',
            rule: {
                action: PermissionAction.MANAGE,
                subject: CommentEntity,
            },
        });

        const permission3 = await permissionRepository.save({
            name: 'Manager Test Permission 3',
            label: 'manager.test.permission.3',
            rule: {
                action: PermissionAction.MANAGE,
                subject: CommentEntity,
            },
        });

        testPermissions = [permission1, permission2, permission3];
    }

    async function cleanupTestData() {
        if (testPermissions && testPermissions.length > 0) {
            await permissionRepository.remove(testPermissions);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /permissions', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return paginated permissions with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should handle pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions?page=1&limit=5`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should fail with invalid token', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should handle invalid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions?page=0&limit=0`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('GET /permissions/:id', () => {
        it('should require authentication', async () => {
            const permission = testPermissions[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions/${permission.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return permission detail with authentication', async () => {
            const permission = testPermissions[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions/${permission.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const permissionDetail = result.json();
            expect(permissionDetail.id).toBe(permission.id);
            expect(permissionDetail.name).toBe(permission.name);
            expect(permissionDetail.label).toBe(permission.label);
            expect(permissionDetail.description).toBe(permission.description);
        });

        it('should return permission without description if not set', async () => {
            const permissionWithoutDesc = testPermissions.find((p) => !p.description);

            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions/${permissionWithoutDesc.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const permissionDetail = result.json();
            expect(permissionDetail.id).toBe(permissionWithoutDesc.id);
            expect(permissionDetail.name).toBe(permissionWithoutDesc.name);
            expect(permissionDetail.label).toBe(permissionWithoutDesc.label);
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions/invalid-uuid`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent permission ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/permissions/74e655b3-b69a-42ae-a101-41c224386e74`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(404);
        });
    });
});
