import { PartialType } from '@nestjs/swagger';
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

import { IsDataExist } from '@/modules/core/constraints/data.exist.constraint';
import { IsTreeUnique } from '@/modules/core/constraints/tree.unique.constraint';
import { IsTreeUniqueExist } from '@/modules/core/constraints/tree.unique.exist.constraint';
import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { PaginateOptions } from '@/modules/database/types';

import { CategoryEntity } from '../entities';

@DtoValidation({ type: 'query' })
export class QueryCategoryDto implements PaginateOptions {
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
}

@DtoValidation({ groups: ['create'] })
export class CreateCategoryDto {
    @IsTreeUnique(CategoryEntity, {
        groups: ['create'],
        message: 'The Category names are duplicated',
    })
    @IsTreeUniqueExist(CategoryEntity, {
        groups: ['update'],
        message: 'The Category names are duplicated',
    })
    @MaxLength(25, {
        always: true,
        message: 'The length of the category name shall not exceed $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: 'The classification name cannot be empty' })
    @IsOptional({ groups: ['update'] })
    name: string;

    @IsDataExist(CategoryEntity, { always: true, message: 'The parent category does not exist' })
    @IsUUID(undefined, {
        always: true,
        message: 'The format of the parent category ID is incorrect.',
    })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;

    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: 'The sorted value must be greater than 0.' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder?: number = 0;
}

@DtoValidation({ groups: ['update'] })
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsUUID(undefined, { message: 'The ID format is incorrect', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: 'The ID must be specified' })
    id: string;
}
