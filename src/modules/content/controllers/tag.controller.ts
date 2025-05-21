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
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/providers/app.interceptor';

import { DEFAULT_VALIDATION_CONFIG } from '../constants';
import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos/tag.dto';
import { TagService } from '../services';

@Controller('tag')
@UseInterceptors(AppInterceptor)
export class TagController {
    constructor(protected service: TagService) {}

    @Get()
    @SerializeOptions({})
    async list(
        @Query(new ValidationPipe(DEFAULT_VALIDATION_CONFIG))
        options: QueryTagDto,
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
        @Body(new ValidationPipe({ ...DEFAULT_VALIDATION_CONFIG, groups: ['create'] }))
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @SerializeOptions({})
    async update(
        @Body(new ValidationPipe({ ...DEFAULT_VALIDATION_CONFIG, groups: ['update'] }))
        date: UpdateTagDto,
    ) {
        return this.service.update(date);
    }

    @Delete(':id')
    @SerializeOptions({})
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
