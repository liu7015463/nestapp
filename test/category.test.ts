import { describe } from 'node:test';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { DataSource } from 'typeorm';

import { database } from '@/config';
import { ContentModule } from '@/modules/content/content.module';
import { CategoryController } from '@/modules/content/controllers';
import { DatabaseModule } from '@/modules/database/database.module';

describe('category test', () => {
    let controller: CategoryController;
    let datasource: DataSource;
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ContentModule, DatabaseModule.forRoot(database)],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        controller = module.get<CategoryController>(CategoryController);
        datasource = module.get<DataSource>(DataSource);
    });
    it('check datasource', () => {
        expect(datasource).toBeDefined();
    });

    it('check new category', () => {
        expect(controller).toBeDefined();
    });

    it('create new category', () => {
        expect(app).toBeDefined();
    });

    it('/category', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/category',
        });
        console.log(result.json());
        expect(result.statusCode).toEqual(200);
        expect(result.json().items).toEqual([]);
    });

    afterAll(async () => {
        await datasource.destroy(); // 关闭数据库连接
        await app.close();
    });
});
