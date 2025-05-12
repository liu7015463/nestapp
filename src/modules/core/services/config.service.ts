import { Global, Injectable, Module } from '@nestjs/common';
import { get } from 'lodash';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ContentModule } from '@/modules/content/content.module';

const config: Record<string, any> = {
    name: 'ray',
};

@Injectable()
export class ConfigService {
    get<T>(key: string, defaultValue?: T): T | undefined {
        return get(config, key, defaultValue);
    }
}

@Global()
@Module({
    providers: [ConfigService],
    exports: [ConfigService],
})
export class CoreModule {}

@Module({
    imports: [ContentModule, CoreModule],
    providers: [AppService],
    controllers: [AppController],
})
export class AppModule {}
