import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { getRandomString } from '@/modules/core/helpers';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/user';

describe('AccountController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let userRepository: UserRepository;
    let testUser: UserEntity;
    let authToken: string;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

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
        // 创建测试用户
        const username = getRandomString();
        testUser = await userRepository.save({
            username,
            nickname: 'Test Account User',
            password: 'password123',
            email: 'testaccount@example.com',
        });
    }

    async function cleanupTestData() {
        if (testUser) {
            await userRepository.remove(testUser);
        }
    }

    describe('POST /account/register', () => {
        it('should register user successfully', async () => {
            const username = getRandomString();
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username,
                    nickname: 'New User',
                    password: 'password123',
                    plainPassword: 'password123',
                },
            });

            expect(result.statusCode).toBe(201);
            const newUser = result.json();
            expect(newUser.username).toBe(username);
            expect(newUser.nickname).toBe('New User');
            // 不应该返回密码
            expect(newUser.password).toBeUndefined();

            // 清理创建的用户
            await userRepository.delete(newUser.id);
        });

        it('should fail with missing required fields', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
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
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username: testUser.username, // 使用已存在的用户名
                    nickname: 'Another User',
                    password: 'password123',
                    plainPassword: 'password123',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('该用户名已被注册');
        });

        it('should fail with invalid email format', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username: 'test_user_email',
                    nickname: 'Test User',
                    password: 'password123',
                    plainPassword: 'password123',
                    email: 'invalid-email',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('property email should not exist');
        });

        it('should fail with password mismatch', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username: 'test_user_pwd',
                    nickname: 'Test User',
                    password: 'password123',
                    plainPassword: 'different_password',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('两次输入密码不同');
        });

        it('should fail with short password', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username: 'test_user_short',
                    nickname: 'Test User',
                    password: '123',
                    plainPassword: '123',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('密码长度不得少于8');
        });

        it('should fail with long username', async () => {
            const username = getRandomString(52);
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username,
                    nickname: 'Test User',
                    password: 'password123',
                    plainPassword: 'password123',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('用户名长度必须为4到30');
        });
    });

    describe('POST /account/login', () => {
        it('should login successfully with username', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: testUser.username,
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(201);
            const response = result.json();
            expect(response.token).toBeDefined();
            expect(typeof response.token).toBe('string');

            // 保存token用于后续测试
            authToken = response.token;
        });

        it('should login successfully with email', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: testUser.email,
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(201);
            const response = result.json();
            expect(response.token).toBeDefined();
        });

        it('should fail with wrong password', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: testUser.username,
                    password: 'wrong-password',
                },
            });

            expect(result.statusCode).toBe(401);
            expect(result.json().message).toContain('Unauthorized');
        });

        it('should fail with non-existent user', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: 'non-existent-user',
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(401);
            expect(result.json().message).toContain('Unauthorized');
        });

        it('should fail with missing credentials', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    // missing credential and password
                },
            });

            expect(result.statusCode).toBe(502);
            const response = result.json();
            expect(response.message).toContain('登录凭证不得为空');
            expect(response.message).toContain('登录凭证长度必须为4到30');
        });

        it('should fail with empty credential', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: '',
                    password: 'password123',
                },
            });

            expect(result.statusCode).toBe(502);
            expect(result.json().message).toContain('登录凭证不得为空');
        });

        it('should fail with empty password', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: testUser.username,
                    password: '',
                },
            });

            expect(result.statusCode).toBe(502);
            expect(result.json().message).toContain('密码长度不得少于8');
        });
    });

    describe('POST /account/logout', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/logout`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should logout successfully', async () => {
            const username = getRandomString();
            const result1 = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/register`,
                body: {
                    username,
                    nickname: 'New User',
                    password: 'password123',
                    plainPassword: 'password123',
                },
            });
            const newUser = result1.json();

            // 首先登录获取token
            const loginResult = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: username,
                    password: 'password123',
                },
            });
            const { token } = loginResult.json();
            console.log(token);
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/logout`,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            expect(result.statusCode).toBe(201);
            // 清理创建的用户
            await userRepository.delete(newUser.id);
        });

        it('should fail with invalid token', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/logout`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('GET /account/profile', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/account/profile`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return user profile successfully', async () => {
            // 确保有有效的token
            if (!authToken) {
                const loginResult = await app.inject({
                    method: 'POST',
                    url: `${URL_PREFIX}/account/login`,
                    body: {
                        credential: testUser.username,
                        password: 'password123',
                    },
                });
                authToken = loginResult.json().token;
            }

            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/account/profile`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const profile = result.json();
            expect(profile.id).toBe(testUser.id);
            expect(profile.username).toBe(testUser.username);
            expect(profile.nickname).toBe(testUser.nickname);
            expect(profile.email).toBe(testUser.email);
            // 不应该返回密码
            expect(profile.password).toBeUndefined();
        });

        it('should fail with invalid token', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/account/profile`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('PATCH /account', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account`,
                body: {
                    nickname: 'Updated Nickname',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update account info successfully', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    nickname: 'Updated Test Account',
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedUser = result.json();
            expect(updatedUser.nickname).toBe('Updated Test Account');
            expect(updatedUser.id).toBe(testUser.id);
        });

        it('should update username successfully', async () => {
            const randomTag = getRandomString(10);
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    username: `updated-account-${randomTag}`,
                },
            });
            console.log(result.json());
            expect(result.statusCode).toBe(200);
            const updatedUser = result.json();
            expect(updatedUser.username).toBe(`updated-account-${randomTag}`);
            testUser.username = `updated-account-${randomTag}`;
        });

        it('should fail with duplicate username', async () => {
            // 创建另一个用户
            const username = `another-account-${getRandomString()}`;
            const anotherUser = await userRepository.save({
                username,
                nickname: 'Another Account',
                password: 'password123',
            });

            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    username, // 尝试使用已存在的用户名
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('该用户名已被注册');

            // 清理
            await userRepository.remove(anotherUser);
        });
    });

    describe('PATCH /account/change-password', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account/change-password`,
                body: {
                    oldPassword: 'password123',
                    password: 'newpassword123',
                    plainPassword: 'newpassword123',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should change password successfully', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account/change-password`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    oldPassword: 'password123',
                    password: 'newpassword123',
                    plainPassword: 'newpassword123',
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证新密码可以登录
            const loginResult = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/account/login`,
                body: {
                    credential: testUser.username,
                    password: 'newpassword123',
                },
            });
            expect(loginResult.statusCode).toBe(201);

            // 恢复原密码以便其他测试
            await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account/change-password`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    oldPassword: 'newpassword123',
                    password: 'password123',
                    plainPassword: 'password123',
                },
            });
        });

        it('should fail with wrong old password', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account/change-password`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    oldPassword: 'wrongpassword',
                    password: 'newpassword123',
                    plainPassword: 'newpassword123',
                },
            });

            expect(result.statusCode).toBe(403);
            expect(result.json().message).toContain('old password do not match');
        });

        it('should fail with password mismatch', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/account/change-password`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    oldPassword: 'password123',
                    password: 'newpassword123',
                    plainPassword: 'differentpassword',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('两次输入密码不同');
        });
    });
});
