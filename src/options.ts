import { join } from 'path';

import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { existsSync } from 'fs-extra';
import { isArray, isNil, omit } from 'lodash';

import { RbacModule } from '@/modules/rbac/rbac.module';
import { UserModule } from '@/modules/user/user.module';

import * as configs from './config';
import { ContentModule } from './modules/content/content.module';
import { GlobalExceptionFilter } from './modules/core/filters/global-exception.filter';
import {
    BullOptions,
    CreateOptions,
    QueueOptions,
    RedisOption,
    RedisOptions,
} from './modules/core/types';
import * as dbCommands from './modules/database/commands';
import { DatabaseModule } from './modules/database/database.module';
import { MeiliModule } from './modules/meilisearch/meili.module';
import { RbacGuard } from './modules/rbac/guards/rbac.guard';
import { Restful } from './modules/restful/restful';
import { RestfulModule } from './modules/restful/restful.module';
import { ApiConfig } from './modules/restful/types';

export const createOptions: CreateOptions = {
    commands: () => [...Object.values(dbCommands)],
    config: { factories: configs as any, storage: { enable: true } },
    modules: async (configure) => [
        await DatabaseModule.forRoot(configure),
        await MeiliModule.forRoot(configure),
        await RestfulModule.forRoot(configure),
        await ContentModule.forRoot(configure),
        await UserModule.forRoot(configure),
        await RbacModule.forRoot(configure),
    ],
    globals: {
        guard: RbacGuard,
        filter: GlobalExceptionFilter,
    },
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
            await restful.factoryDocs(container, metadata);
        }

        return container;
    },
};

/**
 * 生成Redis配置
 * @param options
 */
export const createRedisOptions = (options: RedisOptions) => {
    if (isNil(options)) {
        return undefined;
    }
    const config: Array<RedisOption> = Array.isArray(options)
        ? options
        : [{ ...options, name: 'default' }];
    if (config.length < 1) {
        return undefined;
    }
    if (isNil(config.find(({ name }) => name === 'default'))) {
        config[0].name = 'default';
    }

    return config.reduce<RedisOption[]>((o, n) => {
        const names = o.map(({ name }) => name) as string[];
        return names.includes(n.name) ? o : [...o, n];
    }, []);
};

/**
 * 生成BullMQ模块的配置
 * @param options
 * @param redis
 */
export const createQueueOptions = (
    options: QueueOptions,
    redis: Array<RedisOption>,
): BullOptions | undefined => {
    if (isNil(options) || isNil(redis)) {
        return undefined;
    }
    const names = redis.map(({ name }) => name);
    if (names.length < 1 || !names.includes('default')) {
        return undefined;
    }
    if (isArray(options)) {
        return options.map((option) => ({
            ...omit(option, 'redis'),
            connection: redis.find(({ name: c }) => c === (option.redis ?? 'default')),
        }));
    }
    return {
        ...omit(options, 'redis'),
        connection: redis.find(({ name: c }) => c === (options.redis ?? 'default')),
    };
};
