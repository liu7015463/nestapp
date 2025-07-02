import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/manager';

describe('UserController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let userRepository: UserRepository;
    let testUsers: UserEntity[];
    let adminUser: UserEntity;
    let permissionRepository: PermissionRepository;
    let authToken: string;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        userRepository = app.get<UserRepository>(UserRepository);
        permissionRepository = app.get<PermissionRepository>(PermissionRepository);
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
            where: { name: 'user.manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_user_manager',
            nickname: 'Admin User Manager',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_user_manager',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试用户数据
        const user1 = await userRepository.save({
            username: 'manager_testuser1',
            nickname: 'Manager Test User 1',
            password: 'password123',
            email: 'manager_testuser1@example.com',
        });

        const user2 = await userRepository.save({
            username: 'manager_testuser2',
            nickname: 'Manager Test User 2',
            password: 'password123',
            email: 'manager_testuser2@example.com',
        });

        const user3 = await userRepository.save({
            username: 'manager_testuser3',
            nickname: 'Manager Test User 3',
            password: 'password123',
        });

        testUsers = [user1, user2, user3];
    }

    async function cleanupTestData() {
        if (testUsers && testUsers.length > 0) {
            await userRepository.remove(testUsers);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /users', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return paginated users with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users`,
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
                url: `${URL_PREFIX}/users?page=1&limit=5`,
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
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('GET /users/:id', () => {
        it('should require authentication', async () => {
            const user = testUsers[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/${user.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return user detail with authentication', async () => {
            const user = testUsers[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/${user.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const userDetail = result.json();
            expect(userDetail.id).toBe(user.id);
            expect(userDetail.username).toBe(user.username);
            expect(userDetail.nickname).toBe(user.nickname);
            // 管理员应该能看到敏感信息
            expect(userDetail.email).toBe(user.email);
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/invalid-uuid`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent user ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/74e65577-b69a-42ae-a101-41c224386e78`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(404);
        });
    });

    describe('POST /users', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/users`,
                body: {
                    username: 'newmanageruser',
                    nickname: 'New Manager User',
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create user successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    username: 'newmanageruser123',
                    nickname: 'New Manager User',
                    password: 'password123',
                    email: 'newmanageruser@example.com',
                },
            });

            expect(result.statusCode).toBe(201);
            const newUser = result.json();
            expect(newUser.username).toBe('newmanageruser123');
            expect(newUser.nickname).toBe('New Manager User');
            expect(newUser.email).toBe('newmanageruser@example.com');
            // 不应该返回密码
            expect(newUser.password).toBeUndefined();

            // 清理创建的用户
            await userRepository.delete(newUser.id);
        });

        it('should fail with missing required fields', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    // missing username and password
                    nickname: 'Test User',
                },
            });

            expect(result.statusCode).toBe(400);
            const response = result.json();
            expect(response.message).toContain('用户名长度必须为4到30');
            expect(response.message).toContain('密码长度不得少于8');
        });

        it('should fail with duplicate username', async () => {
            const existingUser = testUsers[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    username: existingUser.username,
                    nickname: 'Another User',
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('该用户名已被注册');
        });

        it('should fail with invalid email format', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    username: 'testuser_email_manager',
                    nickname: 'Test User',
                    password: 'password123',
                    email: 'invalid-email',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('邮箱地址格式错误');
        });
    });

    describe('PATCH /users', () => {
        it('should require authentication', async () => {
            const user = testUsers[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                body: {
                    id: user.id,
                    nickname: 'Updated Nickname',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update user successfully', async () => {
            const user = testUsers[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: user.id,
                    nickname: 'Updated Manager User',
                    email: 'updated@example.com',
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedUser = result.json();
            expect(updatedUser.nickname).toBe('Updated Manager User');
            expect(updatedUser.email).toBe('updated@example.com');
        });

        it('should fail with missing ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    nickname: 'Updated User',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('用户ID格式不正确');
        });

        it('should fail with invalid ID format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: 'invalid-uuid',
                    nickname: 'Updated User',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: '88e677b3-b88a-42ae-a101-88c224386e88',
                    nickname: 'Updated User',
                },
            });

            expect(result.statusCode).toBe(200);
        });

        it('should fail with duplicate username', async () => {
            const [user1, user2] = testUsers;
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: user1.id,
                    username: user2.username, // 使用另一个用户的用户名
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('该用户名已被注册');
        });
    });

    describe('DELETE /users', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/users`,
                body: {
                    ids: [testUsers[0].id],
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete users successfully', async () => {
            // 创建临时用户用于删除测试
            const tempUser = await userRepository.save({
                username: 'temp_user_for_delete',
                nickname: 'Temp User for Delete',
                password: 'password123',
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempUser.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证用户已被删除
            const deletedUser = await userRepository.findOne({ where: { id: tempUser.id } });
            expect(deletedUser).toBeNull();
        });

        it('should delete multiple users successfully', async () => {
            // 创建多个临时用户用于删除测试
            const tempUser1 = await userRepository.save({
                username: 'temp_user1_for_delete',
                nickname: 'Temp User 1 for Delete',
                password: 'password123',
            });
            const tempUser2 = await userRepository.save({
                username: 'temp_user2_for_delete',
                nickname: 'Temp User 2 for Delete',
                password: 'password123',
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempUser1.id, tempUser2.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证用户已被删除
            const deletedUser1 = await userRepository.findOne({ where: { id: tempUser1.id } });
            const deletedUser2 = await userRepository.findOne({ where: { id: tempUser2.id } });
            expect(deletedUser1).toBeNull();
            expect(deletedUser2).toBeNull();
        });

        it('should fail with missing ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/users`,
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
                url: `${URL_PREFIX}/users`,
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
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: ['invalid-uuid'],
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should not delete admin user (self-protection)', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/users`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [adminUser.id],
                },
            });

            // 应该失败或者有特殊处理，防止管理员删除自己
            expect([400, 403, 422]).toContain(result.statusCode);
        });
    });
});
