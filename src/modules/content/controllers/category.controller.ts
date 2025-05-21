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
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CategoryService } from '../services';

@UseInterceptors(AppInterceptor)
@Controller('category')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async tree() {
        return this.service.findTrees();
    }

    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    async list(
        @Query(new ValidationPipe(DEFAULT_VALIDATION_CONFIG))
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Post()
    @SerializeOptions({ groups: ['category-detail'] })
    async store(
        @Body(
            new ValidationPipe({
                ...DEFAULT_VALIDATION_CONFIG,
                groups: ['create'],
            }),
        )
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @SerializeOptions({ groups: ['category-detail'] })
    async update(
        @Body(
            new ValidationPipe({
                ...DEFAULT_VALIDATION_CONFIG,
                groups: ['update'],
            }),
        )
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    @Delete(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
