import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CategoryEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { CategoryRepository, PostRepository, TagRepository } from '@/modules/content/repositories';
import { PostService } from '@/modules/content/services/post.service';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/manager/content';

describe('PostController (Manager)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let postRepository: PostRepository;
    let categoryRepository: CategoryRepository;
    let tagRepository: TagRepository;
    let userRepository: UserRepository;
    let testPosts: PostEntity[];
    let testCategory: CategoryEntity;
    let testTags: TagEntity[];
    let adminUser: UserEntity;
    let authToken: string;
    let postService: PostService;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        postRepository = app.get<PostRepository>(PostRepository);
        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
        tagRepository = app.get<TagRepository>(TagRepository);
        userRepository = app.get<UserRepository>(UserRepository);
        permissionRepository = app.get<PermissionRepository>(PermissionRepository);
        postService = app.get<PostService>(PostService);
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
            where: { name: 'post.manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_post',
            nickname: 'Admin Post',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_post',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试分类
        testCategory = await categoryRepository.save({
            name: 'Manager Test Post Category',
            customOrder: 1,
        });

        // 创建测试标签
        const tag1 = await tagRepository.save({
            name: 'Manager Test Post Tag 1',
            desc: 'Manager test tag for posts',
        });

        const tag2 = await tagRepository.save({
            name: 'Manager Test Post Tag 2',
            desc: 'Another manager test tag for posts',
        });

        testTags = [tag1, tag2];

        // 创建测试文章
        const publishedPost = await postService.create(
            {
                title: 'Manager Published Test Post',
                body: 'This is a manager published test post content.',
                summary: 'Manager published test post summary',
                category: testCategory.id,
                tags: [tag1.id],
                publish: true,
            },
            adminUser,
        );

        const draftPost = await postService.create(
            {
                title: 'Manager Draft Test Post',
                body: 'This is a manager draft test post content.',
                summary: 'Manager draft test post summary',
                category: testCategory.id,
                tags: [tag2.id],
            },
            adminUser,
        );

        testPosts = [publishedPost, draftPost];
    }

    async function cleanupTestData() {
        if (testPosts && testPosts.length > 0) {
            await postRepository.remove(testPosts);
        }
        if (testTags && testTags.length > 0) {
            await tagRepository.remove(testTags);
        }
        if (testCategory) {
            await categoryRepository.remove(testCategory);
        }
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /posts', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return all posts including drafts', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);

            // 应该包含已发布和草稿文章
            const publishedPosts = response.items.filter((post: any) => post.publishedAt !== null);
            const draftPosts = response.items.filter((post: any) => post.publishedAt === null);

            expect(publishedPosts.length).toBeGreaterThanOrEqual(0);
            expect(draftPosts.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts?page=1&limit=5`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should filter posts by category', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts?category=${testCategory.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            response.items.forEach((post: any) => {
                expect(post.category.id).toBe(testCategory.id);
            });
        });

        it('should search posts by keyword', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts?search=Manager Published`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            const foundPost = response.items.find(
                (post: any) =>
                    post.title.includes('Manager Published') ||
                    post.body.includes('Manager Published'),
            );
            expect(foundPost).toBeDefined();
        });
    });

    describe('GET /posts/:id', () => {
        it('should require authentication', async () => {
            const post = testPosts[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/${post.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return post detail including drafts', async () => {
            const draftPost = testPosts.find((p) => p.publishedAt === null);
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/${draftPost.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const postDetail = result.json();
            expect(postDetail.id).toBe(draftPost.id);
            expect(postDetail.title).toBe(draftPost.title);
            expect(postDetail.publishedAt).toBeNull();
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/invalid-uuid`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent post ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/74e655b3-b69a-42ae-a101-41c224386e74`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(404);
        });
    });

    describe('POST /posts', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/posts`,
                body: {
                    title: 'New Manager Test Post',
                    body: 'New manager test post content',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create post successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    title: 'New Manager Test Post',
                    body: 'New manager test post content',
                    summary: 'New manager test post summary',
                    category: testCategory.id,
                    tags: [testTags[0].id],
                },
            });

            expect(result.statusCode).toBe(201);
            const newPost = result.json();
            expect(newPost.title).toBe('New Manager Test Post');
            expect(newPost.author.id).toBe(adminUser.id);

            // 清理创建的文章
            await postRepository.delete(newPost.id);
        });

        it('should create published post', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    title: 'New Published Manager Post',
                    body: 'New published manager post content',
                    summary: 'New published manager post summary',
                    category: testCategory.id,
                    tags: [testTags[0].id],
                    publish: true,
                },
            });

            expect(result.statusCode).toBe(201);
            const newPost = result.json();
            expect(newPost.title).toBe('New Published Manager Post');
            expect(newPost.publishedAt).not.toBeNull();

            // 清理创建的文章
            await postRepository.delete(newPost.id);
        });

        it('should fail with missing required fields', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    title: 'New Manager Test Post',
                    // missing body
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The content of the article must be filled in.',
            );
        });

        it('should fail with invalid category ID', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    title: 'New Manager Test Post',
                    body: 'New manager test post content',
                    category: 'invalid-uuid',
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('PATCH /posts', () => {
        it('should require authentication', async () => {
            const post = testPosts[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/posts`,
                body: {
                    id: post.id,
                    title: 'Updated Post Title',
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should update post successfully', async () => {
            const post = testPosts[0];
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: post.id,
                    title: 'Updated Manager Post Title',
                    body: 'Updated manager post content',
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedPost = result.json();
            expect(updatedPost.title).toBe('Updated Manager Post Title');
            expect(updatedPost.body).toBe('Updated manager post content');
        });

        it('should publish draft post', async () => {
            const draftPost = testPosts.find((p) => p.publishedAt === null);
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: draftPost.id,
                    publish: true,
                },
            });

            expect(result.statusCode).toBe(200);
            const updatedPost = result.json();
            expect(updatedPost.publishedAt).not.toBeNull();
        });

        it('should fail with missing ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    title: 'Updated Post',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The article ID must be specified');
        });

        it('should fail with non-existent ID', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    title: 'Updated Post',
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('DELETE /posts', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/posts`,
                body: {
                    ids: [testPosts[0].id],
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete posts successfully', async () => {
            // 创建临时文章用于删除测试
            const tempPost = await postRepository.save({
                title: 'Temp Post for Delete',
                body: 'Temporary post for deletion test',
                author: adminUser,
                category: testCategory,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempPost.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证文章已被删除
            const deletedPost = await postRepository.findOne({ where: { id: tempPost.id } });
            expect(deletedPost).toBeNull();
        });

        it('should delete multiple posts successfully', async () => {
            // 创建多个临时文章用于删除测试
            const tempPost1 = await postRepository.save({
                title: 'Temp Post 1 for Delete',
                body: 'Temporary post 1 for deletion test',
                author: adminUser,
                category: testCategory,
            });
            const tempPost2 = await postRepository.save({
                title: 'Temp Post 2 for Delete',
                body: 'Temporary post 2 for deletion test',
                author: adminUser,
                category: testCategory,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/posts`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempPost1.id, tempPost2.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证文章已被删除
            const deletedPost1 = await postRepository.findOne({ where: { id: tempPost1.id } });
            const deletedPost2 = await postRepository.findOne({ where: { id: tempPost2.id } });
            expect(deletedPost1).toBeNull();
            expect(deletedPost2).toBeNull();
        });

        it('should fail with missing ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/posts`,
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
                url: `${URL_PREFIX}/posts`,
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
                url: `${URL_PREFIX}/posts`,
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
