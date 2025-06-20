import { DynamicModule, Module } from '@nestjs/common';

import { MeiliService } from '@/modules/meilisearch/meili.service';

import { Configure } from '../config/configure';
import { panic } from '../core/helpers';

@Module({})
export class MeiliModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        if (!configure.has('meili')) {
            await panic({ message: 'MeiliSearch config not exists' });
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
