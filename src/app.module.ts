import { Module } from '@nestjs/common';

import { ContentModule } from './modules/content/content.module';
import { CoreModule } from './modules/core/core.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [ContentModule, CoreModule.forRoot(), DatabaseModule],
})
export class AppModule {}
