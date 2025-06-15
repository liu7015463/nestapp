import { describe } from 'node:test';

import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { isNil, pick } from 'lodash';
import { DataSource } from 'typeorm';

import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import {
    CategoryRepository,
    CommentRepository,
    PostRepository,
    TagRepository,
} from '@/modules/content/repositories';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { MeiliService } from '@/modules/meilisearch/meili.service';

import { createOptions } from '@/options';

import { generateRandomNumber, generateUniqueRandomNumbers } from './generate-mock-data';
import { categoriesData, commentData, INIT_DATA, postData, tagData } from './test-data';

describe('nest app test', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let categoryRepository: CategoryRepository;
    let tagRepository: TagRepository;
    let postRepository: PostRepository;
    let commentRepository: CommentRepository;

    let posts: PostEntity[];
    let categories: CategoryEntity[];
    let tags: TagEntity[];
    let comments: CommentEntity[];
    let searchService: MeiliService;

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        categoryRepository = app.get<CategoryRepository>(CategoryRepository);
        tagRepository = app.get<TagRepository>(TagRepository);
        postRepository = app.get<PostRepository>(PostRepository);
        commentRepository = app.get<CommentRepository>(CommentRepository);
        searchService = app.get<MeiliService>(MeiliService);
        datasource = app.get<DataSource>(DataSource);
        if (!datasource.isInitialized) {
            await datasource.initialize();
        }
        if (INIT_DATA) {
            const client = searchService.getClient();
            client.deleteIndex('content');

            const queryRunner = datasource.createQueryRunner();
            try {
                await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

                datasource.entityMetadatas.map(async (entity) => {
                    const table = entity.schema
                        ? `${entity.schema}.${entity.tableName}`
                        : `${entity.tableName}`;
                    console.log(`TRUNCATE TABLE ${table}`);
                    await queryRunner.query(`TRUNCATE TABLE ${table}`);
                    return table;
                });
            } finally {
                await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
                await queryRunner.release();
            }

            // init category data
            categories = await addCategory(app, categoriesData);
            const ids = categories.map((item) => item.id);
            categories = [];
            await Promise.all(
                ids.map(async (id) => {
                    const result = await app.inject({
                        method: 'GET',
                        url: `/category/${id}`,
                    });
                    categories.push(result.json());
                    return result.json();
                }),
            );

            // init tag data
            tags = await addTag(app, tagData);
            // init post data
            posts = await addPost(
                app,
                postData,
                tags.map((tag) => tag.id),
                categories.map((category) => category.id),
            );
            // init comment data
            comments = await addComment(
                app,
                commentData,
                posts.map((post) => post.id),
            );
        }
    });

    it('check init', async () => {
        expect(app).toBeDefined();
    });

    describe('category test', () => {
        it('repository init', () => {
            expect(categoryRepository).toBeDefined();
        });
        it('repository check data', () => {
            expect(categories.length).toEqual(13);
        });

        it('create category without name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {},
            });
            expect(result.json()).toEqual({
                message: [
                    'The classification name cannot be empty',
                    'The length of the category name shall not exceed 25',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with long name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: 'A'.repeat(30) },
            });
            expect(result.json()).toEqual({
                message: ['The length of the category name shall not exceed 25'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with same name at root level', async () => {
            const rootCategory = categories.find((c) => !c.parent);
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: rootCategory.name },
            });
            expect(result.json()).toEqual({
                message: ['The Category names are duplicated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with same name under same parent', async () => {
            const testData = categories.find((item) => !isNil(item.parent));
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: testData.name,
                    parent: testData.parent.id,
                },
            });
            expect(result.json()).toEqual({
                message: ['The Category names are duplicated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with invalid parent id format', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    parent: 'invalid-uuid',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The format of the parent category ID is incorrect.',
                    'The parent category does not exist',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with non-existent parent id', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    parent: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });
            expect(result.json()).toEqual({
                message: ['The parent category does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with negative custom order', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: -1,
                },
            });
            expect(result.json()).toEqual({
                message: ['The sorted value must be greater than 0.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with empty name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: '' },
            });
            expect(result.json()).toEqual({
                message: ['The classification name cannot be empty'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with whitespace name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: '   ' },
            });
            expect(result.json()).toEqual({
                message: ['The classification name cannot be empty'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with name exactly at limit (25 chars)', async () => {
            const name = 'A'.repeat(25);
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.name).toBe(name);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with name one char over limit (26 chars)', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: 'A'.repeat(26) },
            });
            expect(result.json()).toEqual({
                message: ['The length of the category name shall not exceed 25'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create root category with duplicate name', async () => {
            const rootCategory = categories.find((c) => !c.parent);
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { name: rootCategory.name },
            });
            expect(result.json()).toEqual({
                message: ['The Category names are duplicated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create child category with duplicate name under same parent', async () => {
            const parentCategory = categories.find((c) => c.children.length > 0);
            const existingChild = parentCategory.children[0];

            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: existingChild.name,
                    parent: parentCategory.id,
                },
            });
            expect(result.json()).toEqual({
                message: ['The Category names are duplicated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create child category with same name but different parent', async () => {
            const parent1 = categories.find((c) => c.children.length > 0);
            const parent2 = categories.find((c) => c.id !== parent1.id && c.children.length > 0);
            const childName = parent1.children[0].name;

            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: childName,
                    parent: parent2.id,
                },
            });
            expect(result.statusCode).toEqual(201);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with parent set to null string', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'Root Category',
                    parent: 'null', // 注意：这里传递字符串 'null'
                },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.parent).toBeNull();
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with parent set to null value', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'Root Category',
                    parent: null,
                },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.parent).toBeNull();
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with empty parent id', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    parent: '',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The format of the parent category ID is incorrect.',
                    'The parent category does not exist',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with malformed UUID parent id', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    parent: 'not-a-valid-uuid-123',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The format of the parent category ID is incorrect.',
                    'The parent category does not exist',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with customOrder as string', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: '10', // 字符串形式的数字
                },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.customOrder).toBe(10);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with customOrder as float', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: 5.5,
                },
            });
            expect(result.json()).toEqual({
                message: ['customOrder must be an integer number'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with customOrder as negative number', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: -1,
                },
            });
            expect(result.json()).toEqual({
                message: ['The sorted value must be greater than 0.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create category with customOrder as zero', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: 0,
                },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.customOrder).toBe(0);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with customOrder as large number', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'New Category',
                    customOrder: 999999,
                },
            });
            expect(result.statusCode).toEqual(201);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        it('create category with all valid data', async () => {
            const parent = categories.find((c) => !c.parent);
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'Valid New Category',
                    parent: parent.id,
                    customOrder: 5,
                },
            });
            expect(result.statusCode).toEqual(201);
            const category: CategoryEntity = result.json();
            expect(category.name).toBe('Valid New Category');
            expect(category.parent.id).toBe(parent.id);
            expect(category.customOrder).toBe(5);
            await app.inject({
                method: 'DELETE',
                url: `/category/${result.json().id}`,
            });
        });

        // 树形结构特殊场景测试
        it('create category with parent as self (should fail)', async () => {
            const category = categories[0];
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: {
                    name: 'Invalid Category',
                    parent: category.id,
                    id: category.id, // 尝试设置自己的ID为parent
                },
            });
            // 这里假设后端有循环引用检查
            expect(result.statusCode).toEqual(400);
        });

        // 更新分类验证
        it('update category without id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: { name: 'Updated Category' },
            });
            expect(result.json()).toEqual({
                message: [
                    'The ID must be specified',
                    'The ID format is incorrect',
                    'The Category names are duplicated',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with invalid id format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: 'invalid-uuid',
                    name: 'Updated Category',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The ID format is incorrect',
                    'category id not exist when update',
                    'The Category names are duplicated',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with non-existent id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    name: 'Updated Category',
                },
            });
            expect(result.statusCode).toEqual(400);
        });

        it('update category with long name', async () => {
            const category = categories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: category.id,
                    name: 'A'.repeat(30),
                },
            });
            expect(result.json()).toEqual({
                message: ['The length of the category name shall not exceed 25'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with duplicate name in same parent', async () => {
            const parentCategory = categories.find((c) => c.children?.length > 1);
            const [child1, child2] = parentCategory.children;

            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: child1.id,
                    name: child2.name,
                },
            });
            expect(result.json()).toEqual({
                message: ['The Category names are duplicated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with invalid parent id format', async () => {
            const category = categories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: category.id,
                    parent: 'invalid-uuid',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The format of the parent category ID is incorrect.',
                    'The parent category does not exist',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with non-existent parent id', async () => {
            const category = categories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: category.id,
                    parent: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });
            expect(result.json()).toEqual({
                message: ['The parent category does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update category with negative custom order', async () => {
            const category = categories[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/category',
                body: {
                    id: category.id,
                    customOrder: -1,
                },
            });
            expect(result.json()).toEqual({
                message: ['The sorted value must be greater than 0.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        // 查询分类验证
        it('query categories with invalid page', async () => {
            const result = await app.inject({
                method: 'GET',
                url: '/category?page=0',
            });
            expect(result.json()).toEqual({
                message: ['The current page must be greater than 1.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('query categories with invalid limit', async () => {
            const result = await app.inject({
                method: 'GET',
                url: '/category?limit=0',
            });
            expect(result.json()).toEqual({
                message: ['The number of data displayed per page must be greater than 1.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });
    });

    describe('tag test', () => {
        it('tag init', () => {
            expect(tagRepository).toBeDefined();
        });
        it('tag test data check', () => {
            expect(tags.length).toEqual(tagData.length);
        });
        it('create tag without name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: {},
            });
            expect(result.json()).toEqual({
                message: [
                    'The classification name cannot be empty',
                    'The maximum length of the label name is 255',
                    'The label names are repeated',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create tag with long name', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: { name: 'A'.repeat(256) },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the label name is 255'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create tag with duplicate name', async () => {
            const existingTag = tags[0];
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: { name: existingTag.name },
            });
            expect(result.json()).toEqual({
                message: ['The label names are repeated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create tag with long description', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: {
                    name: 'NewTag',
                    desc: 'A'.repeat(501),
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the label description is 500'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        // 更新标签验证
        it('update tag without id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: { name: 'Updated Tag' },
            });
            expect(result.json()).toEqual({
                message: [
                    'The ID must be specified',
                    'The ID format is incorrect',
                    'The label names are repeated',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update tag with invalid id format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: {
                    id: 'invalid-uuid',
                    name: 'Updated Tag',
                },
            });
            expect(result.json()).toEqual({
                message: ['The ID format is incorrect', 'tag id not exist when update'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update tag with non-existent id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    name: 'Updated Tag',
                },
            });
            expect(result.json()).toEqual({
                message: ['tag id not exist when update'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update tag with long name', async () => {
            const tag = tags[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: {
                    id: tag.id,
                    name: 'A'.repeat(256),
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the label name is 255'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update tag with duplicate name', async () => {
            const [tag1, tag2] = tags;
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: {
                    id: tag1.id,
                    name: tag2.name,
                },
            });
            expect(result.json()).toEqual({
                message: ['The label names are repeated'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update tag with long description', async () => {
            const tag = tags[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/tag',
                body: {
                    id: tag.id,
                    desc: 'A'.repeat(501),
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the label description is 500'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });
    });

    describe('posts test', () => {
        it('posts init', () => {
            expect(postRepository).toBeDefined();
        });
        it('posts test data check', () => {
            expect(posts.length).toEqual(postData.length);
        });

        // 创建文章验证
        it('create post without title', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: { body: 'Post content' },
            });
            expect(result.json()).toEqual({
                message: [
                    'The article title must be filled in.',
                    'The maximum length of the article title is 255',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post without body', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: { title: 'New Post' },
            });
            expect(result.json()).toEqual({
                message: ['The content of the article must be filled in.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with long title', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'A'.repeat(256),
                    body: 'Post content',
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the article title is 255'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with long summary', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    summary: 'A'.repeat(501),
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the article description is 500'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with invalid category', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    category: 'invalid-uuid',
                },
            });
            expect(result.json()).toEqual({
                message: ['The ID format is incorrect', 'The category does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with non-existent category', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    category: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });
            expect(result.json()).toEqual({
                message: ['The category does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with invalid tag format', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    tags: ['invalid-uuid'],
                },
            });
            expect(result.json()).toEqual({
                message: ['The ID format is incorrect', 'The tag does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with non-existent tag', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    tags: ['74e655b3-b69a-42ae-a101-41c224386e74'],
                },
            });
            expect(result.json()).toEqual({
                message: ['The tag does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with long keyword', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    keywords: ['keyword1', 'A'.repeat(21)],
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of each keyword is 20'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create post with negative custom order', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: {
                    title: 'New Post',
                    body: 'Content',
                    customOrder: -1,
                },
            });
            expect(result.json()).toEqual({
                message: ['The sorted value must be greater than 0.'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        // 更新文章验证
        it('update post without id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/posts',
                body: { title: 'Updated Post' },
            });
            expect(result.json()).toEqual({
                message: [
                    'The article ID must be specified',
                    'The format of the article ID is incorrect.',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update post with invalid id format', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/posts',
                body: {
                    id: 'invalid-uuid',
                    title: 'Updated Post',
                },
            });
            expect(result.json()).toEqual({
                message: [
                    'The format of the article ID is incorrect.',
                    'post id not exist when update',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update post with non-existent id', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: '/posts',
                body: {
                    id: '74e655b3-b69a-42ae-a101-41c224386e74',
                    title: 'Updated Post non-existent id',
                },
            });
            expect(result.json()).toEqual({
                message: ['post id not exist when update'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('update post with long title', async () => {
            const post = posts[0];
            const result = await app.inject({
                method: 'PATCH',
                url: '/posts',
                body: {
                    id: post.id,
                    title: 'A'.repeat(256),
                },
            });
            expect(result.json()).toEqual({
                message: ['The maximum length of the article title is 255'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });
    });

    describe('comment test', () => {
        it('comment init', () => {
            expect(commentRepository).toBeDefined();
        });
        it('comment test data check', () => {
            expect(comments.length).toEqual(commentData.length);
        });

        // 创建评论验证
        it('create comment without body', async () => {
            const post = posts[0];
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: { post: post.id },
            });
            expect(result.json()).toEqual({
                message: [
                    'Comment content cannot be empty',
                    'The length of the comment content cannot exceed 1000',
                ],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment without post', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: { body: 'Test comment' },
            });
            expect(result.json()).toEqual({
                message: ['The post ID must be specified', 'The ID format is incorrect'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment with long body', async () => {
            const post = posts[0];
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: {
                    body: 'A'.repeat(1001),
                    post: post.id,
                },
            });
            expect(result.json()).toEqual({
                message: ['The length of the comment content cannot exceed 1000'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment with invalid post format', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: {
                    body: 'Test comment',
                    post: 'invalid-uuid',
                },
            });
            expect(result.json()).toEqual({
                message: ['The ID format is incorrect', 'The post does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment with non-existent post', async () => {
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: {
                    body: 'Test comment',
                    post: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });
            expect(result.json()).toEqual({
                message: ['The post does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment with invalid parent format', async () => {
            const post = posts[0];
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: {
                    body: 'Test comment',
                    post: post.id,
                    parent: 'invalid-uuid',
                },
            });
            expect(result.json()).toEqual({
                message: ['The ID format is incorrect', 'The parent comment does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });

        it('create comment with non-existent parent', async () => {
            const post = posts[0];
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: {
                    body: 'Test comment',
                    post: post.id,
                    parent: '74e655b3-b69a-42ae-a101-41c224386e74',
                },
            });
            expect(result.json()).toEqual({
                message: ['The parent comment does not exist'],
                error: 'Bad Request',
                statusCode: 400,
            });
        });
    });

    afterAll(async () => {
        await datasource.destroy(); // 关闭数据库连接
        await app.close();
    });
});

async function addCategory(
    app: NestFastifyApplication,
    data: RecordAny[],
    parentId?: string,
): Promise<CategoryEntity[]> {
    const results: CategoryEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { ...pick(item, ['name', 'customOrder']), parent: parentId },
            });
            const addedItem: CategoryEntity = result.json();
            results.push(addedItem);
            results.push(...(await addCategory(app, item.children, addedItem.id)));
        }
    }
    return results;
}

async function addTag(app: NestFastifyApplication, data: RecordAny[]): Promise<TagEntity[]> {
    const results: TagEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: item,
            });
            const addedItem: TagEntity = result.json();
            results.push(addedItem);
        }
    }
    return results;
}

async function addPost(
    app: NestFastifyApplication,
    data: RecordAny[],
    tags: string[] = [],
    categories: string[] = [],
) {
    const results: PostEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            item.category = categories[generateRandomNumber(1, categories.length - 1)[0]];
            item.tags = generateUniqueRandomNumbers(0, tags.length - 1, 3).map((idx) => tags[idx]);
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: item,
            });
            const addedItem: PostEntity = result.json();
            results.push(addedItem);
        }
    }
    return results;
}

async function addComment(
    app: NestFastifyApplication,
    data: RecordAny[],
    posts: string[],
): Promise<CommentEntity[]> {
    const results: CommentEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            item.post = posts[generateRandomNumber(0, posts.length - 1)[0]];

            const commentsFilter = results
                .filter((comment) => comment.post === item.post)
                .map((comment) => comment.id);
            item.parent =
                commentsFilter.length > 0
                    ? commentsFilter[generateRandomNumber(0, commentsFilter.length - 1)[0]]
                    : undefined;
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: item,
            });
            const addedItem = result.json();
            results.push(addedItem);
        }
    }
    return results;
}
