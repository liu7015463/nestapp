import { describe } from 'node:test';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { omit, pick } from 'lodash';
import { DataSource } from 'typeorm';

import { database } from '@/config';
import { ContentModule } from '@/modules/content/content.module';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from '@/modules/content/entities';
import { CategoryRepository, PostRepository, TagRepository } from '@/modules/content/repositories';
import { DatabaseModule } from '@/modules/database/database.module';

import { CommentRepository } from '../src/modules/content/repositories/comment.repository';

import { commentData, INIT_DATA, initialCategories, postData, tagData } from './test-data';

describe('category test', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let categoryRepository: CategoryRepository;
    let tagRepository: TagRepository;
    let postRepository: PostRepository;
    let commentRepository: CommentRepository;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ContentModule, DatabaseModule.forRoot(database)],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        categoryRepository = module.get<CategoryRepository>(CategoryRepository);
        tagRepository = module.get<TagRepository>(TagRepository);
        postRepository = module.get<PostRepository>(PostRepository);
        commentRepository = module.get<CommentRepository>(CommentRepository);
        datasource = module.get<DataSource>(DataSource);
        if (INIT_DATA) {
            await categoryRepository.deleteAll();
            await postRepository.deleteAll();
            await tagRepository.deleteAll();
            await commentRepository.deleteAll();

            // init category data
            const categories = await addCategory(app, initialCategories);
            console.log(categories);
            // init tag data
            const tags = await addTag(app, tagData);
            console.log(tags);
            // init post data
            addPost(
                app,
                postData,
                tags.map((tag) => tag.id),
                categories.map((category) => category.id),
            );
            // init comment data
            addComment(app, commentData);
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
            // TODO add tag and category
            const result = await app.inject({
                method: 'POST',
                url: '/post',
                body: omit(item, ['tags', 'category']),
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
): Promise<CommentEntity[]> {
    const comments: CommentEntity[] = [];
    if (app && data && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            const result = await app.inject({
                method: 'POST',
                url: '/comment',
                body: item,
            });
            const addedItem: CommentEntity = result.json();
            comments.push(addedItem);
        }
    }
    return comments;
}
