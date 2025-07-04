import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import { isArray, isNil, omit } from 'lodash';

import { RedisService, SmsService, SmtpService } from '@/modules/core/services';
import { QueueOptions, RedisOptions, SmsOptions, SmtpOptions } from '@/modules/core/types';

import { createQueueOptions, createRedisOptions } from '@/options';

import { Configure } from '../config/configure';

@Module({})
export class CoreModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        await configure.store('app.name');
        const providers: ModuleMetadata['providers'] = [];
        const exports: ModuleMetadata['exports'] = [];
        let imports: ModuleMetadata['imports'] = [];
        const redis = createRedisOptions(await configure.get<RedisOptions>('redis'));
        if (!isNil(redis)) {
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

        const sms = await configure.get<SmsOptions>('sms');
        if (!isNil(sms)) {
            providers.push({
                provide: SmsService,
                useFactory: () => new SmsService(sms),
            });
            exports.push(SmsService);
        }

        const smtp = await configure.get<SmtpOptions>('smtp');
        if (!isNil(smtp)) {
            providers.push({
                provide: SmtpService,
                useFactory: () => new SmtpService(smtp),
            });
            exports.push(SmtpService);
        }
        return {
            module: CoreModule,
            global: true,
            providers,
            exports,
            imports,
        };
    }
}
