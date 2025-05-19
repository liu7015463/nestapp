import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { PostEntity } from '@/modules/content/entities/post.entity';
import { PostRepository } from '@/modules/content/repositories/post.repository';
import { SanitizeService } from '@/modules/content/services/SanitizeService';
import { PostService } from '@/modules/content/services/post.service';

import { PostSubscriber } from '@/modules/content/subscribers/post.subscriber';
import { DatabaseModule } from '@/modules/database/database.module';

import { PostController } from './controllers/post.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity]),
        DatabaseModule.forRepository([PostRepository]),
    ],
    controllers: [PostController],
    providers: [PostService, PostSubscriber, SanitizeService],
    exports: [PostService, DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule {}
