import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { PaginateOptions } from '@/modules/database/types';

/**
 * 分页数据查询验证
 */
@DtoValidation({ type: 'query' })
export class PaginateDto implements PaginateOptions {
    /**
     * 当前页
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'The current page must be greater than 1.' })
    @IsNumber()
    @IsOptional()
    page?: number = 1;

    /**
     * 每页数据量
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'The number of data displayed per page must be greater than 1.' })
    @IsNumber()
    @IsOptional()
    limit?: number = 10;
}
