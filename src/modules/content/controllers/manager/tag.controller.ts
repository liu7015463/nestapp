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

import { ApiTags } from '@nestjs/swagger';

import { ContentModule } from '@/modules/content/content.module';
import { DeleteDto } from '@/modules/content/dtos/delete.dto';
import { CreateTagDto, UpdateTagDto } from '@/modules/content/dtos/tag.dto';
import { TagEntity } from '@/modules/content/entities';
import { TagService } from '@/modules/content/services';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

const permission: PermissionChecker = async (ab) => ab.can(PermissionAction.MANAGE, TagEntity.name);

@ApiTags('标签查询')
@Depends(ContentModule)
@Controller('tag')
export class TagController {
    constructor(protected service: TagService) {}

    /**
     * 分页查询标签列表
     * @param options
     */
    @Get()
    @Permission(permission)
    @SerializeOptions({})
    async list(
        @Query()
        options: PaginateDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 查询标签详情
     * @param id
     */
    @Get(':id')
    @Permission(permission)
    @SerializeOptions({})
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    /**
     * 添加新标签
     * @param data
     */
    @Post()
    @Permission(permission)
    @SerializeOptions({})
    async store(
        @Body()
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    /**
     * 更新标签
     * @param data
     */
    @Patch()
    @Permission(permission)
    @SerializeOptions({})
    async update(
        @Body()
        data: UpdateTagDto,
    ) {
        return this.service.update(data);
    }

    /**
     * 批量删除标签
     * @param data
     */
    @Delete()
    @Permission(permission)
    @SerializeOptions({})
    async delete(@Body() data: DeleteDto) {
        return this.service.delete(data.ids);
    }
}
