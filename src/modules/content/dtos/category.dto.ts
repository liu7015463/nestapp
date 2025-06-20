import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints/data.exist.constraint';
import { IsTreeUnique } from '@/modules/database/constraints/tree.unique.constraint';
import { IsTreeUniqueExist } from '@/modules/database/constraints/tree.unique.exist.constraint';

import { CategoryEntity } from '../entities';

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
    @IsInt({ always: true })
    @IsOptional({ always: true })
    customOrder?: number = 0;
}

@DtoValidation({ groups: ['update'] })
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsDataExist(CategoryEntity, {
        groups: ['update'],
        message: 'category id not exist when update',
    })
    @IsUUID(undefined, { message: 'The ID format is incorrect', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: 'The ID must be specified' })
    id: string;
}
