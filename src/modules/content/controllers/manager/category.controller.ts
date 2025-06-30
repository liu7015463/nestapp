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

import { ContentModule } from '@/modules/content/content.module';
import { CreateCategoryDto, UpdateCategoryDto } from '@/modules/content/dtos/category.dto';
import { CategoryEntity } from '@/modules/content/entities';
import { CategoryService } from '@/modules/content/services';
import { PermissionAction } from '@/modules/rbac/constants';
import { Permission } from '@/modules/rbac/decorators/permission.decorator';
import { PermissionChecker } from '@/modules/rbac/types';
import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

const permission: PermissionChecker = async (ab) =>
    ab.can(PermissionAction.MANAGE, CategoryEntity.name);

@ApiTags('分类管理')
@ApiBearerAuth()
@Depends(ContentModule)
@Controller('category')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    /**
     * Search category tree
     */
    @Get('tree')
    @Permission(permission)
    @SerializeOptions({ groups: ['category-tree'] })
    async tree() {
        return this.service.findTrees();
    }

    /**
     * 分页查询分类列表
     * @param options
     */
    @Get()
    @Permission(permission)
    @SerializeOptions({ groups: ['category-list'] })
    async list(
        @Query()
        options: PaginateDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 查询分类明细
     * @param id
     */
    @Get(':id')
    @Permission(permission)
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Post()
    @Permission(permission)
    @SerializeOptions({ groups: ['category-detail'] })
    async store(
        @Body()
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @Permission(permission)
    @SerializeOptions({ groups: ['category-detail'] })
    async update(
        @Body()
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    @Delete(':id')
    @Permission(permission)
    @SerializeOptions({ groups: ['category-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete([id]);
    }
}
