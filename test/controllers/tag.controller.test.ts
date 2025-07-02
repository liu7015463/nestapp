import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { TagEntity } from '@/modules/content/entities';
import { TagRepository } from '@/modules/content/repositories';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/content';

describe('TagController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let tagRepository: TagRepository;
    let testTags: TagEntity[];

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        tagRepository = app.get<TagRepository>(TagRepository);
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
        // 创建测试标签数据
        const tag1 = await tagRepository.save({
            name: 'Test Tag 1',
            desc: 'Test tag description 1',
        });

        const tag2 = await tagRepository.save({
            name: 'Test Tag 2',
            desc: 'Test tag description 2',
        });

        const tag3 = await tagRepository.save({
            name: 'Test Tag 3',
        });

        testTags = [tag1, tag2, tag3];
    }

    async function cleanupTestData() {
        if (testTags && testTags.length > 0) {
            await tagRepository.remove(testTags);
        }
    }

    describe('GET /tag', () => {
        it('should return paginated tags successfully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should return tags with valid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?page=1&limit=5`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should fail with invalid page parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?page=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should fail with invalid limit parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?limit=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The number of data displayed per page must be greater than 1.');
        });

        it('should handle negative page numbers', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?page=-1`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should handle negative limit values', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?limit=-5`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The number of data displayed per page must be greater than 1.');
        });

        it('should handle large page numbers gracefully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?page=999999`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toEqual([]);
        });

        it('should return tags with correct structure', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag?limit=1`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            if (response.items.length > 0) {
                const tag = response.items[0];
                expect(tag.id).toBeDefined();
                expect(tag.name).toBeDefined();
                expect(typeof tag.name).toBe('string');
            }
        });
    });

    describe('GET /tag/:id', () => {
        it('should return tag detail successfully', async () => {
            const tag = testTags[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/${tag.id}`,
            });

            expect(result.statusCode).toBe(200);
            const tagDetail = result.json();
            expect(tagDetail.id).toBe(tag.id);
            expect(tagDetail.name).toBe(tag.name);
            expect(tagDetail.desc).toBe(tag.desc);
        });

        it('should return tag without description if not set', async () => {
            const tagWithoutDesc = testTags.find(t => !t.desc);
            if (tagWithoutDesc) {
                const result = await app.inject({
                    method: 'GET',
                    url: `${URL_PREFIX}/tag/${tagWithoutDesc.id}`,
                });

                expect(result.statusCode).toBe(200);
                const tagDetail = result.json();
                expect(tagDetail.id).toBe(tagWithoutDesc.id);
                expect(tagDetail.name).toBe(tagWithoutDesc.name);
            }
        });

        it('should fail with invalid UUID format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should fail with non-existent tag ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/74e655b3-b69a-42ae-a101-41c224386e74`,
            });

            expect(result.statusCode).toBe(404);
        });

        it('should handle empty UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/`,
            });

            expect(result.statusCode).toBe(400);
        });

        it('should handle malformed UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/not-a-uuid-at-all`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should handle UUID with wrong format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/12345678-1234-1234-1234-123456789012345`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });
    });
});
