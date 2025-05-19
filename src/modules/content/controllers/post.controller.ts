import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';

import { PostService } from '@/modules/content/services/post.service';
import { PaginateOptions } from '@/modules/database/types';

@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get()
    async list(@Query() options: PaginateOptions) {
        return this.postService.paginate(options);
    }

    @Get(':id')
    async show(@Param('id', new ParseIntPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Post()
    async store(
        @Body()
        data: RecordAny,
    ) {
        return this.postService.create(data);
    }

    @Patch()
    async update(
        @Body()
        data: RecordAny,
    ) {
        return this.postService.update(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.delete(id);
    }
}
