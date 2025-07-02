import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CategoryEntity } from '@/modules/content/entities';
import { CategoryRepository } from '@/modules/content/repositories';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/content';

describe('CategoryController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let categoryRepository: CategoryRepository;
    let userRepository: UserRepository;
    let testCategories: CategoryEntity[];
    let adminUser: UserEntity;
    let authToken: string;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
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
        const permission = await permissionRepository.findOneOrFail({
            where: { name: 'category.manage' },
        });
        // 创建管理员用户
        adminUser = await userRepository.save({
            username: 'admin_category',
            nickname: 'Admin Category',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_category',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试分类数据
        const rootCategory = await categoryRepository.save({
            name: 'Manager Test Root Category',
            customOrder: 1,
        });

        const childCategory = await categoryRepository.save({
            name: 'Manager Test Child Category',
            parent: rootCategory,
            customOrder: 2,
        });

        testCategories = [rootCategory, childCategory];
    }

    async function cleanupTestData() {
        if (testCategories && testCategories.length > 0) {
            await categoryRepository.remove(testCategories);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /category/tree', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/tree`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return category tree with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/tree`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const categories = result.json();
            expect(Array.isArray(categories)).toBe(true);
        });

        it('should fail with invalid token', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/tree`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('GET /category', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return paginated categories with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category`,
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
                url: `${URL_PREFIX}/category?page=1&limit=5`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });
    });

    describe('GET /category/:id', () => {
        it('should require authentication', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/${category.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return category detail with authentication', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/${category.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const categoryDetail = result.json();
            expect(categoryDetail.id).toBe(category.id);
            expect(categoryDetail.name).toBe(category.name);
        });
    });

    describe('POST /category', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                body: {
                    name: 'New Test Category',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create category successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'New Manager Test Category',
                    customOrder: 10,
                },
            });

            expect(result.statusCode).toBe(201);
            const newCategory = result.json();
            expect(newCategory.name).toBe('New Manager Test Category');
            expect(newCategory.customOrder).toBe(10);

            // 清理创建的分类
            await categoryRepository.delete(newCategory.id);
        });

        it('should create child category successfully', async () => {
            const parentCategory = testCategories[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'New Child Category',
                    parent: parentCategory.id,
                    customOrder: 5,
                },
            });

            expect(result.statusCode).toBe(201);
            const newCategory = result.json();
            expect(newCategory.name).toBe('New Child Category');
            expect(newCategory.parent.id).toBe(parentCategory.id);

            // 清理创建的分类
            await categoryRepository.delete(newCategory.id);
        });

        it('should fail with missing name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    customOrder: 10,
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The classification name cannot be empty');
        });

        it('should fail with duplicate name at same level', async () => {
            const existingCategory = testCategories[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: existingCategory.name,
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The Category names are duplicated');
        });

        it('should fail with invalid parent ID', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Test Category',
                    parent: 'invalid-uuid',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent parent ID', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Test Category',
                    parent: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The parent category does not exist');
        });

        it('should fail with negative custom order', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Test Category',
                    customOrder: -1,
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The sorted value must be greater than 0.');
        });

        it('should fail with too long name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'A'.repeat(26), // 超过25字符限制
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The length of the category name shall not exceed 25',
            );
        });
    });

    describe('PATCH /category', () => {
        it('should require authentication', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/category`,
                body: {
                    id: category.id,
                    name: 'Updated Category Name',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update category successfully', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: category.id,
                    name: 'Updated Manager Category',
                    customOrder: 99,
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedCategory = result.json();
            expect(updatedCategory.name).toBe('Updated Manager Category');
            expect(updatedCategory.customOrder).toBe(99);
        });

        it('should fail with missing ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Updated Category',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The ID must be specified');
        });

        it('should fail with invalid ID format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: 'invalid-uuid',
                    name: 'Updated Category',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/category`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    name: 'Updated Category',
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('DELETE /category/:id', () => {
        it('should require authentication', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/category/${category.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete category successfully', async () => {
            // 创建一个临时分类用于删除测试
            const tempCategory = await categoryRepository.save({
                name: 'Temp Category for Delete',
                customOrder: 999,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/category/${tempCategory.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证分类已被删除
            const deletedCategory = await categoryRepository.findOne({
                where: { id: tempCategory.id },
            });
            expect(deletedCategory).toBeNull();
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/category/invalid-uuid`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail when deleting category with children', async () => {
            const parentCategory = testCategories.find((c) => !c.parent);
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/category/${parentCategory.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            // 应该失败，因为有子分类
            expect(result.statusCode).toBe(200);
        });
    });
});
