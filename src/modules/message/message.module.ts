import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import { isArray, isNil, omit } from 'lodash';

import { Configure } from '../config/configure';

import { createQueueOptions, createRedisOptions } from './config';
import { RedisService, SmtpService } from './services';
import { QueueOptions, RedisOptions, SmtpOptions } from './types';
import type { RedisOption } from './types';

@Module({})
export class MessageModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        const redis: RedisOption[] | undefined = createRedisOptions(
            await configure.get<RedisOptions>('redis'),
        );
        const providers: ModuleMetadata['providers'] = [];
        const exports: ModuleMetadata['exports'] = [];
        let imports: ModuleMetadata['imports'] = [];
        if (redis) {
            providers.push({
                provide: RedisService,
                useFactory: () => {
                    const service = new RedisService(redis);
                    service.createClients();
                    return service;
                },
            });
            exports.push(RedisService);

            const queues = createQueueOptions(await configure.get<QueueOptions>('queue'), redis);
            if (!isNil(queues)) {
                if (isArray(queues)) {
                    imports = queues.map((v) => BullModule.forRoot(v.name, omit(v, 'name')));
                } else {
                    imports.push(BullModule.forRoot(queues));
                }
            }
        }

        const smtp = await configure.get<SmtpOptions>('smtp');
        if (smtp) {
            providers.push({
                provide: SmtpService,
                useFactory: () => new SmtpService(smtp),
            });
            exports.push(SmtpService);
        }
        return { module: MessageModule, providers, exports, imports };
    }
}
