import { PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDefined,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { PaginateOptions } from '@/modules/database/types';

@DtoValidation({ type: 'query' })
export class QueryCommentDto implements PaginateOptions {
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'The current page must be greater than 1.' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'The number of data displayed per page must be greater than 1.' })
    @IsNumber()
    @IsOptional()
    limit = 10;

    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsOptional()
    post?: string;
}

@DtoValidation({ type: 'query' })
export class QueryCommentTreeDto extends PickType(QueryCommentDto, ['post']) {}

@DtoValidation()
export class CreateCommentDto {
    @MaxLength(1000, { message: '' })
    @IsNotEmpty({ message: '' })
    body: string;

    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsDefined({ message: 'The ID must be specified' })
    post: string;

    @IsUUID(undefined, { message: 'The ID format is incorrect', always: true })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}
