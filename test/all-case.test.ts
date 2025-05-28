import { describe } from 'node:test';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { pick } from 'lodash';
import { DataSource } from 'typeorm';

import { AppModule } from '@/app.module';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import {
    CategoryRepository,
    CommentRepository,
    PostRepository,
    TagRepository,
} from '@/modules/content/repositories';

import { generateRandomNumber, generateUniqueRandomNumbers } from './generate-mock-data';
import { categoriesData, commentData, INIT_DATA, postData, tagData } from './test-data';

describe('category test', () => {
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

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        categoryRepository = module.get<CategoryRepository>(CategoryRepository);
        tagRepository = module.get<TagRepository>(TagRepository);
        postRepository = module.get<PostRepository>(PostRepository);
        commentRepository = module.get<CommentRepository>(CommentRepository);
        datasource = module.get<DataSource>(DataSource);
        if (!datasource.isInitialized) {
            await datasource.initialize();
        }
        if (INIT_DATA) {
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

        // const category1: CreateCategoryDto = {};
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

        it('create category with same name', async () => {
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
    });

    describe('tag test', () => {
        it('tag init', () => {
            expect(tagRepository).toBeDefined();
        });
        it('tag test data check', () => {
            expect(tags.length).toEqual(tagData.length);
        });
    });

    describe('posts test', () => {
        it('posts init', () => {
            expect(postRepository).toBeDefined();
        });
        it('posts test data check', () => {
            expect(posts.length).toEqual(postData.length);
        });
    });

    describe('comment test', () => {
        it('comment init', () => {
            expect(commentRepository).toBeDefined();
        });
        it('comment test data check', () => {
            expect(comments.length).toEqual(commentData.length);
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
