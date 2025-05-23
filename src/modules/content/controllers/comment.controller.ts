import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    SerializeOptions,
    UseInterceptors,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/providers/app.interceptor';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos/comment.dto';
import { CommentService } from '../services';

@Controller('comment')
@UseInterceptors(AppInterceptor)
export class CommentController {
    constructor(protected service: CommentService) {}

    @Get('tree')
    @SerializeOptions({ groups: ['comment-tree'] })
    async tree(@Query() options: QueryCommentTreeDto) {
        return this.service.findTrees(options);
    }

    @Get()
    @SerializeOptions({ groups: ['comment-list'] })
    async list(
        @Query()
        options: QueryCommentDto,
    ) {
        return this.service.paginate(options);
    }

    @Post()
    @SerializeOptions({ groups: ['comment-detail'] })
    async store(@Body() data: CreateCommentDto) {
        return this.service.create(data);
    }

    @Delete(':id')
    @SerializeOptions({ groups: ['comment-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
