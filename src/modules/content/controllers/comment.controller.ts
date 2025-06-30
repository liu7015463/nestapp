import { Body, Controller, Delete, Get, Post, Query, SerializeOptions } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { In } from 'typeorm';

import { CommentEntity } from '@/modules/content/entities';
import { CommentRepository } from '@/modules/content/repositories';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { checkOwnerPermission } from '@/modules/rbac/utils';
import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { Guest } from '@/modules/user/decorators/guest.decorator';

import { RequestUser } from '@/modules/user/decorators/user.request.decorator';

import { UserEntity } from '@/modules/user/entities';

import { ContentModule } from '../content.module';
import {
    CreateCommentDto,
    DeleteCommentDto,
    QueryCommentDto,
    QueryCommentTreeDto,
} from '../dtos/comment.dto';
import { CommentService } from '../services';

const permissions: Record<'create' | 'owner', PermissionChecker> = {
    create: async (ab) => ab.can(PermissionAction.CREATE, CommentEntity.name),
    owner: async (ab, ref, request) =>
        checkOwnerPermission(ab, {
            request,
            getData: async (items) =>
                ref.get(CommentRepository, { strict: false }).find({
                    relations: ['user'],
                    where: { id: In(items) },
                }),
        }),
};

@ApiTags('评论操作')
@Depends(ContentModule)
@Controller('comment')
export class CommentController {
    constructor(protected service: CommentService) {}
    /**
     * 查询评论树
     * @param options
     */
    @Get('tree')
    @Guest()
    @SerializeOptions({ groups: ['comment-tree'] })
    async tree(@Query() options: QueryCommentTreeDto) {
        return this.service.findTrees(options);
    }

    /**
     * 查询评论列表
     * @param options
     */
    @Get()
    @Guest()
    @SerializeOptions({ groups: ['comment-list'] })
    async list(
        @Query()
        options: QueryCommentDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 新增评论
     * @param data
     * @param author
     */
    @Post()
    @ApiBearerAuth()
    @Permission(permissions.create)
    @SerializeOptions({ groups: ['comment-detail'] })
    async store(@Body() data: CreateCommentDto, @RequestUser() author: ClassToPlain<UserEntity>) {
        return this.service.create(data, author);
    }

    /**
     * 批量删除评论
     * @param data
     */
    @Delete()
    @ApiBearerAuth()
    @Permission(permissions.owner)
    @SerializeOptions({ groups: ['comment-detail'] })
    async delete(@Body() data: DeleteCommentDto) {
        return this.service.delete(data.ids);
    }
}
