import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { RoleEntity } from '@/modules/rbac/entities';
import { PermissionRepository, RoleRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/rbac';

describe('RoleController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let roleRepository: RoleRepository;
    let userRepository: UserRepository;
    let testRoles: RoleEntity[];
    let adminUser: UserEntity;
    let authToken: string;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        roleRepository = app.get<RoleRepository>(RoleRepository);
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
            where: { name: 'role.manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_role_manager',
            nickname: 'Admin Role Manager',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_role_manager',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试角色数据
        const role1 = await roleRepository.save({
            name: 'Manager Test Role 1',
            label: 'manager-test-role-1',
            description: 'Manager test role description 1',
        });

        const role2 = await roleRepository.save({
            name: 'Manager Test Role 2',
            label: 'manager-test-role-2',
            description: 'Manager test role description 2',
        });

        const role3 = await roleRepository.save({
            name: 'Manager Test Role 3',
            label: 'manager-test-role-3',
        });

        testRoles = [role1, role2, role3];
    }

    async function cleanupTestData() {
        if (testRoles && testRoles.length > 0) {
            await roleRepository.remove(testRoles);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('POST /roles', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                body: {
                    name: 'New Test Role',
                    label: 'new-test-role',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create role successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'New Manager Test Role',
                    label: 'new-manager-test-role',
                },
            });

            expect(result.statusCode).toBe(201);
            const newRole = result.json();
            expect(newRole.name).toBe('New Manager Test Role');
            expect(newRole.label).toBe('new-manager-test-role');

            // 清理创建的角色
            await roleRepository.delete(newRole.id);
        });

        it('should create role without description', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Role Without Description',
                    label: 'role-without-description',
                },
            });

            expect(result.statusCode).toBe(201);
            const newRole = result.json();
            expect(newRole.name).toBe('Role Without Description');
            expect(newRole.label).toBe('role-without-description');

            // 清理创建的角色
            await roleRepository.delete(newRole.id);
        });

        it('should fail with missing name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    label: 'test-role-label',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('名称必须填写');
            expect(result.json().message).toContain('名称长度最大为100');
        });

        it('should success with missing label', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Test Role Name',
                },
            });

            expect(result.statusCode).toBe(201);
        });

        it('should success with duplicate name', async () => {
            const existingRole = testRoles[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: existingRole.name,
                    label: 'different-label',
                },
            });

            expect(result.statusCode).toBe(201);
        });
    });

    describe('PATCH /roles', () => {
        it('should require authentication', async () => {
            const role = testRoles[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/roles`,
                body: {
                    id: role.id,
                    name: 'Updated Role Name',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update role successfully', async () => {
            const role = testRoles[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: role.id,
                    name: 'Updated Manager Role',
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedRole = result.json();
            expect(updatedRole.name).toBe('Updated Manager Role');
        });

        it('should fail with missing ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Updated Role',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('ID必须指定');
        });

        it('should fail with invalid ID format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: 'invalid-uuid',
                    name: 'Updated Role',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    name: 'Updated Role',
                },
            });
            expect(result.statusCode).toBe(404);
        });
    });

    describe('DELETE /roles', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                body: {
                    ids: [testRoles[0].id],
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete roles successfully', async () => {
            // 创建临时角色用于删除测试
            const tempRole = await roleRepository.save({
                name: 'Temp Role for Delete',
                label: 'temp-role-for-delete',
                description: 'Temporary role for deletion test',
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempRole.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证角色已被删除
            const deletedRole = await roleRepository.findOne({ where: { id: tempRole.id } });
            expect(deletedRole).toBeNull();
        });

        it('should delete multiple roles successfully', async () => {
            // 创建多个临时角色用于删除测试
            const tempRole1 = await roleRepository.save({
                name: 'Temp Role 1 for Delete',
                label: 'temp-role-1-for-delete',
            });
            const tempRole2 = await roleRepository.save({
                name: 'Temp Role 2 for Delete',
                label: 'temp-role-2-for-delete',
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempRole1.id, tempRole2.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证角色已被删除
            const deletedRole1 = await roleRepository.findOne({ where: { id: tempRole1.id } });
            const deletedRole2 = await roleRepository.findOne({ where: { id: tempRole2.id } });
            expect(deletedRole1).toBeNull();
            expect(deletedRole2).toBeNull();
        });

        it('should fail with missing ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {},
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with empty ids array', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [],
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with invalid UUID in ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/roles`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: ['invalid-uuid'],
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });
});
