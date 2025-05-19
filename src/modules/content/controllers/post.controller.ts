import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    ValidationPipe,
} from '@nestjs/common';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '@/modules/content/dtos/post.dto';
import { PostService } from '@/modules/content/services/post.service';

@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get()
    async list(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidUnknownValues: true,
                forbidNonWhitelisted: true,
                validationError: { target: false },
            }),
        )
        options: QueryPostDto,
    ) {
        return this.postService.paginate(options);
    }

    @Get(':id')
    async show(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidUnknownValues: true,
                forbidNonWhitelisted: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        return this.postService.create(data);
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidUnknownValues: true,
                forbidNonWhitelisted: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.delete(id);
    }
}
