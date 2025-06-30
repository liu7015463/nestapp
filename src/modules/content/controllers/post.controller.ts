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

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { In, IsNull, Not } from 'typeorm';

import {
    FrontendCreatePostDto,
    FrontendQueryPostDto,
    OwnerQueryPostDto,
    OwnerUpdatePostDto,
} from '@/modules/content/dtos/post.dto';
import { PostEntity } from '@/modules/content/entities';
import { PostRepository } from '@/modules/content/repositories';
import { PostService } from '@/modules/content/services/post.service';

import { SelectTrashMode } from '@/modules/database/constants';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { checkOwnerPermission } from '@/modules/rbac/utils';
import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { Guest } from '@/modules/user/decorators/guest.decorator';

import { RequestUser } from '@/modules/user/decorators/user.request.decorator';
import { UserEntity } from '@/modules/user/entities';

import { ContentModule } from '../content.module';
import { DeleteWithTrashDto, RestoreDto } from '../dtos/delete.with.trash.dto';

const permissions: Record<'create' | 'owner', PermissionChecker> = {
    create: async (ab) => ab.can(PermissionAction.CREATE, PostEntity.name),
    owner: async (ab, ref, request) =>
        checkOwnerPermission(ab, {
            request,
            getData: async (items) =>
                ref
                    .get(PostRepository, { strict: false })
                    .find({ relations: ['author'], where: { id: In(items) } }),
        }),
};

@ApiTags('文章操作')
@Depends(ContentModule)
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    /**
     * 查询文章列表
     * @param options
     */
    @Get()
    @Guest()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: FrontendQueryPostDto,
    ) {
        return this.postService.paginate({
            ...options,
            isPublished: true,
            trashed: SelectTrashMode.NONE,
        });
    }

    /**
     * 分页查询自己发布的文章列表
     * @param options
     * @param author
     */
    @Get('owner')
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-list'] })
    async listOwner(
        @Query()
        options: OwnerQueryPostDto,
        @RequestUser() author: ClassToPlain<UserEntity>,
    ) {
        return this.postService.paginate({
            ...options,
            author: author.id,
        });
    }

    /**
     * 查询文章详情
     * @param id
     */
    @Get(':id')
    @Guest()
    @SerializeOptions({ groups: ['post-detail'] })
    async show(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id, async (qb) =>
            qb.andWhere({ publishedAt: Not(IsNull()), deletedAt: Not(IsNull()) }),
        );
    }

    /**
     * 查询自己发布的文章详情
     * @param id
     */
    @Get('owner/:id')
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permissions.owner)
    async detailOwner(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.postService.detail(id, async (qb) => qb.withDeleted());
    }

    /**
     * 新增文章
     * @param data
     * @param author
     */
    @Post()
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permissions.create)
    async store(
        @Body()
        data: FrontendCreatePostDto,
        @RequestUser() author: ClassToPlain<UserEntity>,
    ) {
        return this.postService.create(data, author);
    }

    /**
     * 更新自己发布的文章
     * @param data
     */
    @Patch()
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permissions.owner)
    async update(
        @Body()
        data: OwnerUpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    /**
     * 批量删除自己发布的文章
     * @param data
     */
    @Delete()
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-list'] })
    @Permission(permissions.owner)
    async delete(
        @Body()
        data: DeleteWithTrashDto,
    ) {
        const { ids, trash } = data;
        return this.postService.delete(ids, trash);
    }

    /**
     * 批量恢复自己发布的文章
     * @param data
     */
    @Patch('restore')
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['post-list'] })
    @Permission(permissions.owner)
    async restore(
        @Body()
        data: RestoreDto,
    ) {
        const { ids } = data;
        return this.postService.restore(ids);
    }
}
