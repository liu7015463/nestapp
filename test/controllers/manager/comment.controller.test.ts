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

const URL_PREFIX = '/api/v1/manager/content';

describe('CommentController (Manager)', () => {
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
    let adminUser: UserEntity;
    let authToken: string;
    let permissionRepository: PermissionRepository;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        commentRepository = app.get<CommentRepository>(CommentRepository);
        postRepository = app.get<PostRepository>(PostRepository);
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
        // 创建管理员用户
        const permission = await permissionRepository.findOneOrFail({
            where: { name: 'comment.manage' },
        });
        adminUser = await userRepository.save({
            username: 'admin_comment',
            nickname: 'Admin Comment',
            password: 'password123',
            permissions: [permission],
        });

        // 创建普通用户
        testUser = await userRepository.save({
            username: 'testuser_manager_comment',
            nickname: 'Test User Manager Comment',
            password: 'password123',
        });

        // 获取认证token
        const loginResult = await app.inject({
            method: 'POST',
            url: '/api/v1/user/account/login',
            body: {
                credential: 'admin_comment',
                password: 'password123',
            },
        });
        authToken = loginResult.json().token;

        // 创建测试分类
        testCategory = await categoryRepository.save({
            name: 'Manager Test Comment Category',
            customOrder: 1,
        });

        // 创建测试文章
        testPost = await postRepository.save({
            title: 'Manager Test Post for Comments',
            body: 'This is a manager test post for comments.',
            summary: 'Manager test post summary',
            author: testUser,
            category: testCategory,
            publishedAt: new Date(),
        });

        // 创建测试评论
        const parentComment = await commentRepository.save({
            body: 'This is a manager parent comment.',
            post: testPost,
            author: testUser,
        });

        const childComment = await commentRepository.save({
            body: 'This is a manager child comment.',
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
        if (adminUser) {
            await userRepository.remove(adminUser);
        }
    }

    describe('GET /comments', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comments`,
            });

            expect(result.statusCode).toBe(401);
        });

        it('should return paginated comments with authentication', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comments`,
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

        it('should filter comments by post', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comments?post=${testPost.id}`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            response.items.forEach((comment: any) => {
                expect(comment.post.id).toBe(testPost.id);
            });
        });

        it('should handle pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comments?page=1&limit=5`,
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
                url: `${URL_PREFIX}/comments`,
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });

            expect(result.statusCode).toBe(401);
        });
    });

    describe('GET /comments/:id', () => {
        it('should require authentication', async () => {
            const comment = testComments[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/comments/${comment.id}`,
            });

            expect(result.statusCode).toBe(404);
        });
    });

    describe('DELETE /comments', () => {
        it('should require authentication', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/comments`,
                body: {
                    ids: [testComments[0].id],
                },
            });

            expect(result.statusCode).toBe(401);
        });

        it('should delete comments successfully', async () => {
            // 创建临时评论用于删除测试
            const tempComment = await commentRepository.save({
                body: 'Temp comment for delete',
                post: testPost,
                author: testUser,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/comments`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempComment.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证评论已被删除
            const deletedComment = await commentRepository.findOne({
                where: { id: tempComment.id },
            });
            expect(deletedComment).toBeNull();
        });

        it('should delete multiple comments successfully', async () => {
            // 创建多个临时评论用于删除测试
            const tempComment1 = await commentRepository.save({
                body: 'Temp comment 1 for delete',
                post: testPost,
                author: testUser,
            });
            const tempComment2 = await commentRepository.save({
                body: 'Temp comment 2 for delete',
                post: testPost,
                author: testUser,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/comments`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [tempComment1.id, tempComment2.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证评论已被删除
            const deletedComment1 = await commentRepository.findOne({
                where: { id: tempComment1.id },
            });
            const deletedComment2 = await commentRepository.findOne({
                where: { id: tempComment2.id },
            });
            expect(deletedComment1).toBeNull();
            expect(deletedComment2).toBeNull();
        });

        it('should fail with missing ids', async () => {
            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/comments`,
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
                url: `${URL_PREFIX}/comments`,
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
                url: `${URL_PREFIX}/comments`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: ['invalid-uuid'],
                },
            });

            expect(result.statusCode).toBe(400);
        });

        it('should delete parent comment and its children', async () => {
            // 创建父评论和子评论用于测试级联删除
            const parentComment = await commentRepository.save({
                body: 'Parent comment for cascade delete',
                post: testPost,
                author: testUser,
            });

            const childComment = await commentRepository.save({
                body: 'Child comment for cascade delete',
                post: testPost,
                author: testUser,
                parent: parentComment,
            });

            const result = await app.inject({
                method: 'DELETE',
                url: `${URL_PREFIX}/comments`,
                headers: {
                    authorization: `Bearer ${authToken}`,
                },
                body: {
                    ids: [parentComment.id],
                },
            });

            expect(result.statusCode).toBe(200);

            // 验证父评论和子评论都被删除
            const deletedParent = await commentRepository.findOne({
                where: { id: parentComment.id },
            });
            const deletedChild = await commentRepository.findOne({
                where: { id: childComment.id },
            });
            expect(deletedParent).toBeNull();
            expect(deletedChild).toBeNull();
        });
    });
});
