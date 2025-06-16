import { join } from 'path';

import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { existsSync } from 'fs-extra';
import { isNil } from 'lodash';

import * as configs from './config';
import { ContentModule } from './modules/content/content.module';
import { CreateOptions } from './modules/core/types';
import { DatabaseModule } from './modules/database/database.module';
import { MeiliModule } from './modules/meilisearch/meili.module';
import { Restful } from './modules/restful/restful';
import { RestfulModule } from './modules/restful/restful.module';
import { ApiConfig } from './modules/restful/types';

export const createOptions: CreateOptions = {
    commands: () => [],
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
        if (!isNil(await configure.get<ApiConfig>('api', null))) {
            const restful = container.get(Restful);
            let metadata: () => Promise<RecordAny>;
            if (existsSync(join(__dirname, 'metadata.js'))) {
                metadata = (await import(join(__dirname, 'metadata.js'))).default;
            }
            if (existsSync(join(__dirname, 'metadata.ts'))) {
                metadata = (await import(join(__dirname, 'metadata.ts'))).default;
            }
            await restful.factoryDocs(container, metadata);
        }

        return container;
    },
};
