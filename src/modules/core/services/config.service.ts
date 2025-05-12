import { DynamicModule, Global, Injectable, Module } from '@nestjs/common';
import { get } from 'lodash';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ContentModule } from '@/modules/content/content.module';

const config: Record<string, any> = {
    name: 'ray',
};

@Injectable()
export class ConfigService {
    protected config: RecordAny = {};

    constructor(data: RecordAny) {
        this.config = data;
    }

    get<T>(key: string, defaultValue?: T): T | undefined {
        return get(config, key, defaultValue);
    }
}

@Global()
@Module({
    providers: [ConfigService],
    exports: [ConfigService],
})
export class CoreModule {
    static forRoot(options: { config: RecordAny }): DynamicModule {
        return {
            module: CoreModule,
            global: true,
            providers: [
                {
                    provide: ConfigService,
                    useFactory() {
                        return new ConfigService(options.config);
                    },
                },
            ],
            exports: [ConfigService],
        };
    }
}

@Module({
    imports: [ContentModule, CoreModule.forRoot({ config: { name: 'ray' } })],
    providers: [AppService],
    controllers: [AppController],
})
export class AppModule {}
