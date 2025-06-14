import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import * as configs from './config';
import { ContentModule } from './modules/content/content.module';
import { CreateOptions } from './modules/core/types';
import { DatabaseModule } from './modules/database/database.module';
import { MeiliModule } from './modules/meilisearch/meili.module';
import { Restful } from './modules/restful/restful';
import { RestfulModule } from './modules/restful/restful.module';

export const createOptions: CreateOptions = {
    config: { factories: configs as any, storage: { enable: true } },
    modules: async (configure) => [
        DatabaseModule.forRoot(configure),
        MeiliModule.forRoot(configure),
        RestfulModule.forRoot(configure),
        ContentModule.forRoot(configure),
    ],
    globals: {},
    builder: async ({ configure, BootModule }) => {
        const container = await NestFactory.create<NestFastifyApplication>(
            BootModule,
            new FastifyAdapter(),
            {
                cors: true,
                logger: ['error', 'warn'],
            },
        );
        const restful = container.get(Restful);
        await restful.factoryDocs(container);
        return container;
    },
};
