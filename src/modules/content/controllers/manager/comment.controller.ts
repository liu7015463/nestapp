import { Body, Controller, Delete, Get, Query, SerializeOptions } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ContentModule } from '@/modules/content/content.module';
import { QueryCommentDto } from '@/modules/content/dtos/comment.dto';
import { DeleteDto } from '@/modules/content/dtos/delete.dto';
import { CommentEntity } from '@/modules/content/entities';
import { CommentService } from '@/modules/content/services';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

const permission: PermissionChecker = async (ab) =>
    ab.can(PermissionAction.MANAGE, CommentEntity.name);

@ApiTags('评论管理')
@ApiBearerAuth()
@Depends(ContentModule)
@Controller('comments')
export class CommentController {
    constructor(protected service: CommentService) {}

    /**
     * 查询评论列表
     * @param query
     */
    @Get()
    @SerializeOptions({ groups: ['comment-list'] })
    @Permission(permission)
    async list(
        @Query()
        query: QueryCommentDto,
    ) {
        return this.service.paginate(query);
    }

    /**
     * 批量删除评论
     * @param data
     */
    @Delete()
    @SerializeOptions({ groups: ['comment-list'] })
    @Permission(permission)
    async delete(
        @Body()
        data: DeleteDto,
    ) {
        const { ids } = data;
        return this.service.delete(ids);
    }
}
