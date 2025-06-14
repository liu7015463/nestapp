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
    SerializeOptions,
} from '@nestjs/common';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '@/modules/content/dtos/post.dto';
import { PostService } from '@/modules/content/services/post.service';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { ContentModule } from '../content.module';
import { DeleteWithTrashDto, RestoreDto } from '../dtos/delete.with.trash.dto';

@Depends(ContentModule)
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: QueryPostDto,
    ) {
        return this.postService.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async show(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    async store(
        @Body()
        data: CreatePostDto,
    ) {
        return this.postService.create(data);
    }

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body()
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Delete()
    @SerializeOptions({ groups: ['post-detail'] })
    async delete(@Body() data: DeleteWithTrashDto) {
        return this.postService.delete(data.ids, data.trash);
    }

    @Patch('restore')
    @SerializeOptions({ groups: ['post-detail'] })
    async restore(
        @Body()
        data: RestoreDto,
    ) {
        return this.postService.restore(data.ids);
    }
}
