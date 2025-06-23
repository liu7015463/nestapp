import { DynamicModule, Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';

import { Configure } from '@/modules/config/configure';

import { DatabaseModule } from '@/modules/database/database.module';
import { addEntities, addSubscribers } from '@/modules/database/utils';

import * as entities from './entities';
import * as guards from './guards';
import * as interceptors from './interceptors';
import * as repositories from './repositories';
import * as services from './services';
import * as strategies from './strategies';
import * as subscribers from './subscribers';

@Module({})
export class UserModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        return {
            module: UserModule,
            imports: [
                PassportModule,
                services.TokenService.JwtModuleFactory(configure),
                await addEntities(configure, Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            providers: [
                ...Object.values(interceptors),
                ...Object.values(services),
                ...Object.values(strategies),
                ...Object.values(guards),
                ...(await addSubscribers(configure, Object.values(subscribers))),
            ],
            exports: [
                ...Object.values(services),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
        };
    }
}
