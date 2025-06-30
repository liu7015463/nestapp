import { Controller, Get, Param, ParseUUIDPipe, Query, SerializeOptions } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

import { Guest } from '@/modules/user/decorators/guest.decorator';

import { ContentModule } from '../content.module';
import { TagService } from '../services';

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
    @Guest()
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
    @Guest()
    @SerializeOptions({})
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }
}
