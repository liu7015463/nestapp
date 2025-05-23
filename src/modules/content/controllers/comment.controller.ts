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
} from '@nestjs/common';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos/comment.dto';
import { CommentService } from '../services';

@Controller('comment')
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
