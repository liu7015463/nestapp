import { Module } from '@nestjs/common';

import { PostService } from '@/modules/content/services/post.service';

import { PostController } from './controllers/post.controller';

@Module({
    controllers: [PostController],
    providers: [PostService],
    exports: [PostService],
})
export class ContentModule {}
