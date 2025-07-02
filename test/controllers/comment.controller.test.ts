import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { CategoryEntity, CommentEntity, PostEntity } from '@/modules/content/entities';
import {
    CategoryRepository,
    CommentRepository,
    PostRepository,
} from '@/modules/content/repositories';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { PermissionRepository } from '@/modules/rbac/repositories';
import { UserEntity } from '@/modules/user/entities';
import { UserRepository } from '@/modules/user/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/content';

describe('CommentController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let commentRepository: CommentRepository;
    let postRepository: PostRepository;
    let categoryRepository: CategoryRepository;
    let userRepository: UserRepository;
    let testComments: CommentEntity[];
    let testPost: PostEntity;
    let testCategory: CategoryEntity;
    let testUser: UserEntity;
    let authToken: string;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        datasource = app.get<DataSource>(DataSource);
        commentRepository = app.get<CommentRepository>(CommentRepository);
        postRepository = app.get<PostRepository>(PostRepository);
        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
        userRepository = app.get<UserRepository>(UserRepository);
        permissionRepository = app.get<PermissionRepository>(PermissionRepository);

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
        const permission = await permissionRepository.findOneOrFail({
            where: { name: 'comment.create' },
        });
        testUser = await userRepository.save({
            username: 'testuser_comment',
            nickname: 'Test User Comment',
            password: 'password123',
            permissions: [permission],
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'testuser_comment',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试分类
        testCategory = await categoryRepository.save({
            name: 'Test Comment Category',
            customOrder: 1,
        });

        // 创建测试文章
        testPost = await postRepository.save({
            title: 'Test Post for Comments',
            body: 'This is a test post for comments.',
            summary: 'Test post summary',
            author: testUser,
            category: testCategory,
            publishedAt: new Date(),
        });

        // 创建测试评论
        const parentComment = await commentRepository.save({
            body: 'This is a parent comment.',
            post: testPost,
            author: testUser,
        });

        const childComment = await commentRepository.save({
            body: 'This is a child comment.',
            post: testPost,
            author: testUser,
            parent: parentComment,
        });

        testComments = [parentComment, childComment];
    }

    async function cleanupTestData() {
        if (testComments && testComments.length > 0) {
            await commentRepository.remove(testComments);
        }
        if (testPost) {
            await postRepository.remove(testPost);
        }
        if (testCategory) {
            await categoryRepository.remove(testCategory);
        }
        if (testUser) {
            await userRepository.remove(testUser);
        }
    }

    describe('GET /comment/tree', () => {
        it('should return comment tree for a post', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment/tree?post=${testPost.id}`,
            });

            expect(result.statusCode).toBe(200);
            const comments = result.json();
            expect(Array.isArray(comments)).toBe(true);

            // 应该包含父评论和子评论的树形结构
            const parentComment = comments.find((c: any) => !c.parent);
            expect(parentComment).toBeDefined();
            expect(parentComment.children).toBeDefined();
            expect(Array.isArray(parentComment.children)).toBe(true);
        });

        it('should fail with invalid post UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment/tree?post=invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
        });

        it('should handle missing post parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment/tree`,
            });

            expect(result.statusCode).toBe(200);
        });
    });

    describe('GET /comment', () => {
        it('should return paginated comments', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should filter comments by post', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment?post=${testPost.id}`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            response.items.forEach((comment: any) => {
                expect(comment.post.id).toBe(testPost.id);
            });
        });

        it('should return comments with pagination', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment?page=1&limit=5`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should fail with invalid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comment?page=0&limit=0`,
            });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('POST /comment', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                body: {
                    body: 'New test comment',
                    post: testPost.id,
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should create comment successfully', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    body: 'New test comment',
                    post: testPost.id,
                },
            });
            expect(result.statusCode).toBe(201);
            const newComment = result.json();
            expect(newComment.body).toBe('New test comment');
            expect(newComment.post.id).toBe(testPost.id);

            // 清理创建的评论
            await commentRepository.delete(newComment.id);
        });

        it('should create reply comment successfully', async () => {
            const parentComment = testComments[0];
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    body: 'Reply to parent comment',
                    post: testPost.id,
                    parent: parentComment.id,
                },
            });

            expect(result.statusCode).toBe(201);
            const replyComment = result.json();
            expect(replyComment.body).toBe('Reply to parent comment');
            expect(replyComment.parent.id).toBe(parentComment.id);

            // 清理创建的评论
            await commentRepository.delete(replyComment.id);
        });

        it('should fail with missing required fields', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    // missing body and post
                },
            });

            expect(result.statusCode).toBe(400);
            const response = result.json();
            expect(response.message).toContain('Comment content cannot be empty');
            expect(response.message).toContain('The post ID must be specified');
        });

        it('should fail with invalid post ID', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    body: 'Test comment',
                    post: 'invalid-uuid',
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should fail with non-existent post', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    body: 'Test comment',
                    post: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The post does not exist');
        });

        it('should fail with too long comment body', async () => {
            const result = await app.inject({
                method: 'POST',
                url: `${URL_PREFIX}/comment`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    body: 'A'.repeat(1001), // 超过1000字符限制
                    post: testPost.id,
                },
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The length of the comment content cannot exceed 1000',
            );
        });
    });
});
