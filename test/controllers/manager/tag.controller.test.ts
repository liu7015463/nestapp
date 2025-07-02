import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { TagEntity } from '@/modules/content/entities';
import { TagRepository } from '@/modules/content/repositories';
import { getRandomString } from '@/modules/core/helpers';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/content';

describe('TagController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let tagRepository: TagRepository;
    let userRepository: UserRepository;
    let testTags: TagEntity[];
    let adminUser: UserEntity;
    let authToken: string;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        permissionRepository = app.get<PermissionRepository>(PermissionRepository);
        tagRepository = app.get<TagRepository>(TagRepository);
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
            where: { name: 'tag.manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_tag',
            nickname: 'Admin Tag',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_tag',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试标签数据
        const tag1 = await tagRepository.save({
            name: 'Manager Test Tag 1',
            desc: 'Manager test tag description 1',
        });

        const tag2 = await tagRepository.save({
            name: 'Manager Test Tag 2',
            desc: 'Manager test tag description 2',
        });

        const tag3 = await tagRepository.save({
            name: 'Manager Test Tag 3',
        });

        testTags = [tag1, tag2, tag3];
    }

    async function cleanupTestData() {
        if (testTags && testTags.length > 0) {
            await tagRepository.remove(testTags);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /tag', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return paginated tags with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag`,
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
                url: `${URL_PREFIX}/tag?page=1&limit=5`,
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
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('GET /tag/:id', () => {
        it('should require authentication', async () => {
            const tag = testTags[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/${tag.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return tag detail with authentication', async () => {
            const tag = testTags[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/${tag.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const tagDetail = result.json();
            expect(tagDetail.id).toBe(tag.id);
            expect(tagDetail.name).toBe(tag.name);
            expect(tagDetail.desc).toBe(tag.desc);
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/tag/invalid-uuid`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('POST /tag', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                body: {
                    name: 'New Test Tag',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create tag successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'New Manager Test Tag',
                    desc: 'New manager test tag description',
                },
            });

            expect(result.statusCode).toBe(201);
            const newTag = result.json();
            expect(newTag.name).toBe('New Manager Test Tag');
            expect(newTag.desc).toBe('New manager test tag description');

            // 清理创建的标签
            await tagRepository.delete(newTag.id);
        });

        it('should create tag without description', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Tag Without Description',
                },
            });

            expect(result.statusCode).toBe(201);
            const newTag = result.json();
            expect(newTag.name).toBe('Tag Without Description');

            // 清理创建的标签
            await tagRepository.delete(newTag.id);
        });

        it('should fail with missing name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    desc: 'Tag description without name',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The classification name cannot be empty');
        });

        it('should fail with duplicate name', async () => {
            const existingTag = testTags[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: existingTag.name,
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The label names are repeated');
        });

        it('should fail with too long name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'A'.repeat(256), // 超过255字符限制
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The maximum length of the label name is 255');
        });

        it('should fail with too long description', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Valid Tag Name',
                    desc: 'A'.repeat(501), // 超过500字符限制
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The maximum length of the label description is 500',
            );
        });

        it('should fail with empty name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: '',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The classification name cannot be empty');
        });

        it('should fail with whitespace only name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: '   ',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The classification name cannot be empty');
        });
    });

    describe('PATCH /tag', () => {
        it('should require authentication', async () => {
            const tag = testTags[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                body: {
                    id: tag.id,
                    name: 'Updated Tag Name',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update tag successfully', async () => {
            const tag = testTags[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: tag.id,
                    name: 'Updated Manager Tag',
                    desc: 'Updated manager tag description',
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedTag = result.json();
            expect(updatedTag.name).toBe('Updated Manager Tag');
            expect(updatedTag.desc).toBe('Updated manager tag description');
        });

        it('should fail with missing ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: 'Updated Tag',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The ID must be specified');
        });

        it('should fail with invalid ID format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: 'invalid-uuid',
                    name: 'Updated Tag',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    name: 'Updated Tag',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with duplicate name', async () => {
            const [tag1, tag2] = testTags;
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: tag1.id,
                    name: tag2.name, // 使用另一个标签的名称
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The label names are repeated');
        });
    });

    describe('DELETE /tag', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/tag`,
                body: {
                    ids: [testTags[0].id],
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete tags successfully', async () => {
            // 创建临时标签用于删除测试
            const tag = getRandomString();
            const tempTag = await tagRepository.save({
                name: `Temp Tag for Delete${tag}`,
                desc: 'Temporary tag for deletion test',
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempTag.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证标签已被删除
            const deletedTag = await tagRepository.findOne({ where: { id: tempTag.id } });
            expect(deletedTag).toBeNull();
        });

        it('should delete multiple tags successfully', async () => {
            // 创建多个临时标签用于删除测试
            const tag = getRandomString();
            const tempTag1 = await tagRepository.save({
                name: `Temp Tag 1 for Delete ${tag}`,
            });
            const tempTag2 = await tagRepository.save({
                name: `Temp Tag 2 for Delete ${tag}`,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/tag`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempTag1.id, tempTag2.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证标签已被删除
            const deletedTag1 = await tagRepository.findOne({ where: { id: tempTag1.id } });
            const deletedTag2 = await tagRepository.findOne({ where: { id: tempTag2.id } });
            expect(deletedTag1).toBeNull();
            expect(deletedTag2).toBeNull();
        });

        it('should fail with missing ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/tag`,
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
                url: `${URL_PREFIX}/tag`,
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
                url: `${URL_PREFIX}/tag`,
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
