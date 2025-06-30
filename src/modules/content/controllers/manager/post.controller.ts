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
import { isNil } from 'lodash';

import { ContentModule } from '@/modules/content/content.module';
import { DeleteWithTrashDto, RestoreDto } from '@/modules/content/dtos/delete.with.trash.dto';
import { PostEntity } from '@/modules/content/entities';
import { PostService } from '@/modules/content/services/post.service';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { Depends } from '@/modules/restful/decorators/depend.decorator';
import { RequestUser } from '@/modules/user/decorators/user.request.decorator';
import { UserEntity } from '@/modules/user/entities';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../../dtos/post.dto';

const permission: PermissionChecker = async (ab) =>
    ab.can(PermissionAction.MANAGE, PostEntity.name);

@ApiTags('文章管理')
@ApiBearerAuth()
@Depends(ContentModule)
@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    /**
     * 查询文章列表
     * @param options
     */
    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    @Permission(permission)
    async manageList(
        @Query()
        options: QueryPostDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 查询文章详情
     * @param id
     */
    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permission)
    async manageDetail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    /**
     * 新增文章
     * @param author
     * @param data
     * @param user
     */
    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permission)
    async storeManage(
        @Body()
        { author, ...data }: CreatePostDto,
        @RequestUser() user: ClassToPlain<UserEntity>,
    ) {
        return this.service.create(data, {
            id: isNil(author) ? user.id : author,
        } as ClassToPlain<UserEntity>);
    }

    /**
     * 更新文章
     * @param data
     */
    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    @Permission(permission)
    async manageUpdate(
        @Body()
        data: UpdatePostDto,
    ) {
        return this.service.update(data);
    }

    /**
     * 批量删除文章
     * @param data
     */
    @Delete()
    @SerializeOptions({ groups: ['post-list'] })
    @Permission(permission)
    async manageDelete(
        @Body()
        data: DeleteWithTrashDto,
    ) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    /**
     * 批量恢复文章
     * @param data
     */
    @Patch('restore')
    @SerializeOptions({ groups: ['post-list'] })
    @Permission(permission)
    async manageRestore(
        @Body()
        data: RestoreDto,
    ) {
        const { ids } = data;
        return this.service.restore(ids);
    }
}
