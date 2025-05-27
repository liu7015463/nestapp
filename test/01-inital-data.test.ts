import { describe } from 'node:test';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { pick } from 'lodash';
import { DataSource } from 'typeorm';

import { database } from '@/config';
import { ContentModule } from '@/modules/content/content.module';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { DatabaseModule } from '@/modules/database/database.module';

import { generateRandomNumber, generateUniqueRandomNumbers } from './generate-mock-data';
import { commentData, INIT_DATA, initialCategories, postData, tagData } from './test-data';

describe('category test', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ContentModule, DatabaseModule.forRoot(database)],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        datasource = module.get<DataSource>(DataSource);
        if (!datasource.isInitialized) {
            await datasource.initialize();
        }
    });

    beforeEach(async () => {
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
                // await queryRunner.query(`TRUNCATE TABLE ${tables}`);
            } finally {
                await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
                await queryRunner.release();
            }

            // init category data
            const categories = await addCategory(app, initialCategories);
            console.log(categories);
            // init tag data
            const tags = await addTag(app, tagData);
            console.log(tags);
            // init post data
            const posts = await addPost(
                app,
                postData,
                tags.map((tag) => tag.id),
                categories.map((category) => category.id),
            );
            console.log(posts);
            console.log('='.repeat(100));
            // init comment data
            const comments = await addComment(
                app,
                commentData,
                posts.map((post) => post.id),
            );
            console.log(comments);
        }
    });

    it('check init', async () => {
        expect(app).toBeDefined();
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
    const categories: CategoryEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            const result = await app.inject({
                method: 'POST',
                url: '/category',
                body: { ...pick(item, ['name', 'customOrder']), parent: parentId },
            });
            const addedItem: CategoryEntity = result.json();
            categories.push(addedItem);
            categories.push(...(await addCategory(app, item.children, addedItem.id)));
        }
    }
    return categories;
}

async function addTag(app: NestFastifyApplication, data: RecordAny[]): Promise<TagEntity[]> {
    const tags: TagEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            const result = await app.inject({
                method: 'POST',
                url: '/tag',
                body: item,
            });
            const addedItem: TagEntity = result.json();
            tags.push(addedItem);
        }
    }
    return tags;
}

async function addPost(
    app: NestFastifyApplication,
    data: RecordAny[],
    tags: string[] = [],
    categories: string[] = [],
) {
    const posts: PostEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            item.category = categories[generateRandomNumber(1, categories.length - 1)[0]];
            item.tags = generateUniqueRandomNumbers(0, tags.length - 1, 3).map((idx) => tags[idx]);
            // console.log(JSON.stringify(item));
            const result = await app.inject({
                method: 'POST',
                url: '/posts',
                body: item,
            });
            const addedItem: PostEntity = result.json();
            posts.push(addedItem);
        }
    }
    return posts;
}

async function addComment(
    app: NestFastifyApplication,
    data: RecordAny[],
    posts: string[],
): Promise<CommentEntity[]> {
    const comments: CommentEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            item.post = posts[generateRandomNumber(0, posts.length - 1)[0]];

            const commentsFilter = comments
                .filter((comment) => comment.post === item.post)
                .map((comment) => comment.id);
            console.log('A'.repeat(100));
            console.log(commentsFilter);
            item.parent =
                commentsFilter.length > 0
                    ? commentsFilter[generateRandomNumber(0, commentsFilter.length - 1)[0]]
                    : undefined;
            console.log(JSON.stringify(item));
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: item,
            });
            const addedItem = result.json();
            console.log(addedItem);
            addedItem.post = item.post;
            comments.push(addedItem);
        }
    }
    return comments;
}
