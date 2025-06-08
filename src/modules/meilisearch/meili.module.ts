import { DynamicModule, Module } from '@nestjs/common';

import { MeiliService } from '@/modules/meilisearch/meili.service';

import { Configure } from '../config/configure';
import { panic } from '../core/helpers';

@Module({})
export class MeiliModule {
    static forRoot(configure: Configure): DynamicModule {
        if (!configure.has('meili')) {
            panic({ message: 'MeilliSearch config not exists' });
        }
        return {
            global: true,
            module: MeiliModule,
            providers: [
                {
                    provide: MeiliService,
                    useFactory: async () => {
                        const service = new MeiliService(await configure.get('meili'));
                        await service.createClients();
                        return service;
                    },
                },
            ],
            exports: [MeiliService],
        };
    }
}
