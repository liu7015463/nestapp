import { Module } from '@nestjs/common';

import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppInterceptor } from '@/modules/core/providers/app.interceptor';

import { database } from './config';

import { DEFAULT_VALIDATION_CONFIG } from './modules/content/constants';
import { ContentModule } from './modules/content/content.module';
import { CoreModule } from './modules/core/core.module';
import { AppFilter } from './modules/core/providers/app.filter';
import { AppPipe } from './modules/core/providers/app.pipe';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [ContentModule, CoreModule.forRoot(), DatabaseModule.forRoot(database)],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new AppPipe(DEFAULT_VALIDATION_CONFIG),
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AppInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: AppFilter,
        },
    ],
})
export class AppModule {}
