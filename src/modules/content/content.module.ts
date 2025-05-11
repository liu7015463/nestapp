import { Module } from '@nestjs/common';

import { PostController } from './controllers/post.controller';

@Module({
    controllers: [PostController],
})
export class ContentModule {}
