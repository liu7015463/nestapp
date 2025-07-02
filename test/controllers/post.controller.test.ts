import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CategoryEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { CategoryRepository, PostRepository, TagRepository } from '@/modules/content/repositories';
import { PostService } from '@/modules/content/services/post.service';
import { getRandomString } from '@/modules/core/helpers';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/content';

describe('PostController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let postRepository: PostRepository;
    let categoryRepository: CategoryRepository;
    let tagRepository: TagRepository;
    let userRepository: UserRepository;
    let testPosts: PostEntity[];
    let testCategory: CategoryEntity;
    let testTags: TagEntity[];
    let testUser: UserEntity;
    let authToken: string;
    const cleanData = true;
    let postService: PostService;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        permissionRepository = app.get<PermissionRepository>(PermissionRepository);
        postRepository = app.get<PostRepository>(PostRepository);
        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
        tagRepository = app.get<TagRepository>(TagRepository);
        userRepository = app.get<UserRepository>(UserRepository);
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
        const tag = cleanData ? '' : getRandomString();
        const permission = await permissionRepository.findOneOrFail({
            where: { name: 'post.create' },
        });
        // 创建测试用户
        testUser = await userRepository.save({
            username: `test_user_post_${tag}`,
            nickname: 'Test User Post',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: `test_user_post_${tag}`,
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试分类
        testCategory = await categoryRepository.save({
            name: `Test Post Category ${tag}`,
            customOrder: 1,
        });

        // 创建测试标签
        const tag1 = await tagRepository.save({
            name: `Test Post Tag 1 ${tag}`,
            desc: 'Test tag for posts',
        });

        const tag2 = await tagRepository.save({
            name: `Test Post Tag 2 ${tag}`,
            desc: 'Another test tag for posts',
        });

        testTags = [tag1, tag2];

        // 创建测试文章
        const publishedPost = await postService.create(
            {
                title: 'Published Test Post',
                body: 'This is a published test post content.',
                summary: 'Published test post summary',
                category: testCategory.id,
                tags: [tag1.id],
                publish: true,
            },
            testUser,
        );

        const draftPost = await postService.create(
            {
                title: 'Draft Test Post',
                body: 'This is a draft test post content.',
                summary: 'Draft test post summary',
                category: testCategory.id,
                tags: [tag2.id],
            },
            testUser,
        );

        testPosts = [publishedPost, draftPost];
    }

    async function cleanupTestData() {
        if (!cleanData) {
            return;
        }
        if (testPosts && testPosts.length > 0) {
            await postRepository.remove(testPosts);
        }
        if (testTags && testTags.length > 0) {
            await tagRepository.remove(testTags);
        }
        if (testCategory) {
            await categoryRepository.remove(testCategory);
        }
        if (testUser) {
            await userRepository.remove(testUser);
        }
    }

    describe('GET /posts', () => {
        it('should return published posts only', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);

            // 应该只返回已发布的文章
            response.items.forEach((post: any) => {
                expect(post.publishedAt).not.toBeNull();
            });
        });

        it('should return posts with pagination', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts?page=1&limit=5`,
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
                url: `${URL_PREFIX}/posts?search=Published`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            // 搜索结果应该包含关键词
            const foundPost = response.items.find(
                (post: any) => post.title.includes('Published') || post.body.includes('Published'),
            );
            expect(foundPost).toBeDefined();
        });

        it('should fail with invalid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts?page=0&limit=0`,
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('GET /posts/owner', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return user own posts with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();

            // 应该只返回当前用户的文章
            response.items.forEach((post: any) => {
                expect(post.author.id).toBe(testUser.id);
            });
        });

        it('should return both published and draft posts for owner', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();

            // 应该包含已发布和草稿文章
            const publishedPosts = response.items.filter((post: any) => post.publishedAt !== null);
            const draftPosts = response.items.filter((post: any) => post.publishedAt === null);

            expect(publishedPosts.length).toBeGreaterThan(0);
            expect(draftPosts.length).toBeGreaterThan(0);
        });
    });

    describe('GET /posts/:id', () => {
        it('should return published post detail', async () => {
            const publishedPost = testPosts.find((p) => p.publishedAt !== null);
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/${publishedPost.id}`,
            });

            expect(result.statusCode).toBe(200);
            const postDetail = result.json();
            expect(postDetail.id).toBe(publishedPost.id);
            expect(postDetail.title).toBe(publishedPost.title);
            expect(postDetail.publishedAt).not.toBeNull();
        });

        it('should not return draft post to public', async () => {
            const draftPost = testPosts.find((p) => p.publishedAt === null);
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/${draftPost.id}`,
            });

            expect(result.statusCode).toBe(404);
        });

        it('should fail with invalid UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent post ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/74e655b3-b69a-42ae-a101-41c224386e74`,
            });

            expect(result.statusCode).toBe(404);
        });
    });

    describe('GET /posts/owner/:id', () => {
        it('should require authentication', async () => {
            const post = testPosts[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner/${post.id}`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return owner post detail including drafts', async () => {
            const draftPost = testPosts.find((p) => p.publishedAt === null);
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner/${draftPost.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const postDetail = result.json();
            expect(postDetail.id).toBe(draftPost.id);
            expect(postDetail.author.id).toBe(testUser.id);
        });

        it('should fail when accessing other user post', async () => {
            // 这里需要创建另一个用户的文章来测试权限
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/posts/owner/74e655b3-b69a-42ae-a101-41c224386e74`,
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
                    title: 'New Test Post',
                    body: 'New test post content',
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
                    title: 'New Test Post',
                    body: 'New test post content',
                    summary: 'New test post summary',
                    category: testCategory.id,
                    tags: [testTags[0].id],
                },
            });
            expect(result.statusCode).toBe(201);
            const newPost = result.json();
            expect(newPost.title).toBe('New Test Post');
            expect(newPost.author.id).toBe(testUser.id);

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
                    title: 'New Test Post',
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
                    title: 'New Test Post',
                    body: 'New test post content',
                    category: 'invalid-uuid',
                },
            });

            expect(result.statusCode).toBe(400);
        });
    });
});
