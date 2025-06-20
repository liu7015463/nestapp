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

import { DeleteDto } from '@/modules/content/dtos/delete.dto';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

import { ContentModule } from '../content.module';
import { CreateTagDto, UpdateTagDto } from '../dtos/tag.dto';
import { TagService } from '../services';

@Depends(ContentModule)
@Controller('tag')
export class TagController {
    constructor(protected service: TagService) {}

    @Get()
    @SerializeOptions({})
    async list(
        @Query()
        options: PaginateDto,
    ) {
        return this.service.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({})
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Post()
    @SerializeOptions({})
    async store(
        @Body()
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @SerializeOptions({})
    async update(
        @Body()
        date: UpdateTagDto,
    ) {
        return this.service.update(date);
    }

    @Delete()
    @SerializeOptions({})
    async delete(@Body() data: DeleteDto) {
        return this.service.delete(data.ids);
    }
}
