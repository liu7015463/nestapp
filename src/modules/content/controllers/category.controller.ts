import { Controller, Get, Param, ParseUUIDPipe, Query, SerializeOptions } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

import { Guest } from '@/modules/user/decorators/guest.decorator';

import { ContentModule } from '../content.module';
import { CategoryService } from '../services';

@ApiTags('分类查询')
@Depends(ContentModule)
@Controller('category')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    /**
     * Search category tree
     */
    @Get('tree')
    @Guest()
    @SerializeOptions({ groups: ['category-tree'] })
    async tree() {
        return this.service.findTrees();
    }

    /**
     * 分页查询分类列表
     * @param options
     */
    @Get()
    @Guest()
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
    @Guest()
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }
}
