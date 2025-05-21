import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import * as controllers from '@/modules/content/controllers';
import * as entities from '@/modules/content/entities';
import * as repositories from '@/modules/content/repositories';
import * as services from '@/modules/content/services';
import { SanitizeService } from '@/modules/content/services/SanitizeService';

import { PostSubscriber } from '@/modules/content/subscribers/post.subscriber';
import { DatabaseModule } from '@/modules/database/database.module';

@Module({
    imports: [
        TypeOrmModule.forFeature(Object.values(entities)),
        DatabaseModule.forRepository(Object.values(repositories)),
    ],
    controllers: Object.values(controllers),
    providers: [...Object.values(services), PostSubscriber, SanitizeService],
    exports: [
        ...Object.values(services),
        DatabaseModule.forRepository(Object.values(repositories)),
    ],
})
export class ContentModule {}
