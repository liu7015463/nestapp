import { describe } from 'node:test';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { pick } from 'lodash';
import { DataSource } from 'typeorm';

import { database } from '@/config';
import { ContentModule } from '@/modules/content/content.module';
import { CategoryEntity } from '@/modules/content/entities';
import { CategoryRepository } from '@/modules/content/repositories';
import { DatabaseModule } from '@/modules/database/database.module';

import { initialCategories } from './test-data';

describe('category test', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let categoryRepository: CategoryRepository;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ContentModule, DatabaseModule.forRoot(database)],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        categoryRepository = module.get<CategoryRepository>(CategoryRepository);
        datasource = module.get<DataSource>(DataSource);
        await categoryRepository.clear();
        // init category data
        const categories = await addCategory(app, initialCategories);
        console.log(categories);
        // init tag data
        addTag(app, []);
        // init post data
        addPost(app, []);
        // init comment data
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

function addTag(app: NestFastifyApplication, data: RecordAny[]) {}

function addPost(app: NestFastifyApplication, data: RecordAny[]) {}
