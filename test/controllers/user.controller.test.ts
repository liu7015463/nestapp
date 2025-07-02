import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/user';

describe('UserController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let userRepository: UserRepository;
    let testUsers: UserEntity[];

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
        // 创建测试用户数据
        const user1 = await userRepository.save({
            username: 'testuser1',
            nickname: 'Test User 1',
            password: 'password123',
            email: 'testuser1@example.com',
        });

        const user2 = await userRepository.save({
            username: 'testuser2',
            nickname: 'Test User 2',
            password: 'password123',
            email: 'testuser2@example.com',
        });

        const user3 = await userRepository.save({
            username: 'testuser3',
            nickname: 'Test User 3',
            password: 'password123',
        });

        testUsers = [user1, user2, user3];
    }

    async function cleanupTestData() {
        if (testUsers && testUsers.length > 0) {
            await userRepository.remove(testUsers);
        }
    }

    describe('GET /users', () => {
        it('should return paginated users successfully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should return users with valid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?page=1&limit=5`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should fail with invalid page parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?page=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should fail with invalid limit parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?limit=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The number of data displayed per page must be greater than 1.',
            );
        });

        it('should handle negative page numbers', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?page=-1`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should handle large page numbers gracefully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?page=999999`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toEqual([]);
        });

        it('should return users without sensitive information', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?limit=1`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();

            if (response.items.length > 0) {
                const user = response.items[0];
                expect(user.id).toBeDefined();
                expect(user.username).toBeDefined();
                expect(user.nickname).toBeDefined();
                // 不应该包含敏感信息
                expect(user.password).toBeUndefined();
            }
        });

        it('should filter users by order parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users?orderBy=createdAt`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(Array.isArray(response.items)).toBe(true);
        });
    });

    describe('GET /users/:id', () => {
        it('should return user detail successfully', async () => {
            const user = testUsers[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/${user.id}`,
            });

            expect(result.statusCode).toBe(200);
            const userDetail = result.json();
            expect(userDetail.id).toBe(user.id);
            expect(userDetail.username).toBe(user.username);
            expect(userDetail.nickname).toBe(user.nickname);
            // 不应该包含敏感信息
            expect(userDetail.password).toBeUndefined();
        });

        it('should return user with email if available', async () => {
            const userWithEmail = testUsers.find((u) => u.email);
            if (userWithEmail) {
                const result = await app.inject({
                    method: 'GET',
                    url: `${URL_PREFIX}/users/${userWithEmail.id}`,
                });

                expect(result.statusCode).toBe(200);
                const userDetail = result.json();
                expect(userDetail.email).toBe(userWithEmail.email);
            }
        });

        it('should fail with invalid UUID format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should fail with non-existent user ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/74e655b3-b99a-42ae-a101-41c224386e74`,
            });

            expect(result.statusCode).toBe(404);
        });

        it('should handle empty UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/`,
            });

            expect(result.statusCode).toBe(400);
        });

        it('should handle malformed UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/not-a-uuid-at-all`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should handle UUID with wrong length', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/users/12345678-1234-1234-1234-123456789012345`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });
    });
});
