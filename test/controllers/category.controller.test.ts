import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CategoryEntity } from '@/modules/content/entities';
import { CategoryRepository } from '@/modules/content/repositories';
import { CategoryService } from '@/modules/content/services';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/content';

describe('CategoryController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let categoryRepository: CategoryRepository;
    let categoryService: CategoryService;
    let testCategories: CategoryEntity[];

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
        categoryService = app.get<CategoryService>(CategoryService);
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
        // 创建测试分类数据
        const rootCategory = await categoryRepository.save({
            name: 'Test Root Category',
            customOrder: 1,
        });

        const childCategory = await categoryRepository.save({
            name: 'Test Child Category',
            parent: rootCategory,
            customOrder: 2,
        });

        testCategories = [rootCategory, childCategory];
    }

    async function cleanupTestData() {
        if (testCategories && testCategories.length > 0) {
            await categoryService.delete(testCategories.map(({ id }) => id));
        }
    }

    describe('GET /category/tree', () => {
        it('should return category tree successfully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/tree`,
            });

            expect(result.statusCode).toBe(200);
            const categories = result.json();
            expect(Array.isArray(categories)).toBe(true);
            expect(categories.length).toBeGreaterThan(0);
        });

        it('should return categories with tree structure', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/tree`,
            });

            const categories = result.json();
            const rootCategory = categories.find((c: any) => c.name === 'Test Root Category');
            expect(rootCategory).toBeDefined();
            expect(rootCategory.children).toBeDefined();
            expect(Array.isArray(rootCategory.children)).toBe(true);
        });
    });

    describe('GET /category', () => {
        it('should return paginated categories successfully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should return categories with valid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category?page=1&limit=10`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(10);
        });

        it('should fail with invalid page parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category?page=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should fail with invalid limit parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category?limit=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The number of data displayed per page must be greater than 1.',
            );
        });

        it('should handle large page numbers gracefully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category?page=999999`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toEqual([]);
        });

        it('should handle large limit values', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category?limit=1000`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.perPage).toBe(1000);
        });
    });

    describe('GET /category/:id', () => {
        it('should return category detail successfully', async () => {
            const category = testCategories[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/${category.id}`,
            });

            expect(result.statusCode).toBe(200);
            const categoryDetail = result.json();
            expect(categoryDetail.id).toBe(category.id);
            expect(categoryDetail.name).toBe(category.name);
        });

        it('should fail with invalid UUID format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should fail with non-existent category ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/74e655b3-b69a-42ae-a101-41c224386e74`,
            });

            expect(result.statusCode).toBe(404);
        });

        it('should return category with children if exists', async () => {
            const rootCategory = testCategories.find((c) => !c.parent);
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/category/${rootCategory.id}`,
            });

            expect(result.statusCode).toBe(200);
            const categoryDetail = result.json();
            expect(categoryDetail.children).toBeDefined();
        });
    });
});
