import { Body, Controller, Delete, Get, Post, Query, SerializeOptions } from '@nestjs/common';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { ContentModule } from '../content.module';
import {
    CreateCommentDto,
    DeleteCommentDto,
    QueryCommentDto,
    QueryCommentTreeDto,
} from '../dtos/comment.dto';
import { CommentService } from '../services';

@Depends(ContentModule)
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

    @Delete()
    @SerializeOptions({ groups: ['comment-detail'] })
    async delete(@Body() data: DeleteCommentDto) {
        return this.service.delete(data.ids);
    }
}
