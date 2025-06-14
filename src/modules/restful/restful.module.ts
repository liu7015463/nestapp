import { DynamicModule } from '@nestjs/common';

import { Configure } from '../config/configure';

import { Restful } from './restful';

export class RestfulModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        const restful = new Restful(configure);
        await restful.create(await configure.get('api'));
        return {
            module: RestfulModule,
            global: true,
            imports: restful.getModuleImports(),
            providers: [
                {
                    provide: Restful,
                    useValue: restful,
                },
            ],
            exports: [Restful],
        };
    }
}
