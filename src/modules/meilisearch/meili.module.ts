import { DynamicModule, Module } from '@nestjs/common';

import { MeiliService } from '@/modules/meilisearch/meili.service';
import { MeiliConfig } from '@/modules/meilisearch/types';
import { createMeiliOptions } from '@/modules/meilisearch/utils';

@Module({})
export class MeiliModule {
    static forRoot(configRegister: () => MeiliConfig): DynamicModule {
        return {
            global: true,
            module: MeiliModule,
            providers: [
                {
                    provide: MeiliService,
                    useFactory: async () => {
                        const service = new MeiliService(
                            await createMeiliOptions(configRegister()),
                        );
                        await service.createClients();
                        return service;
                    },
                },
            ],
            exports: [MeiliService],
        };
    }
}
