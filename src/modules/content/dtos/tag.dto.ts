import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsUUID, MaxLength, Min } from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints';
import { IsUnique } from '@/modules/database/constraints/unique.constraint';
import { IsUniqueExist } from '@/modules/database/constraints/unique.exist.constraint';
import { PaginateOptions } from '@/modules/database/types';

import { TagEntity } from '../entities';

@DtoValidation({ type: 'query' })
export class QueryTagDto implements PaginateOptions {
    @Transform(({ value }) => toNumber(value))
    @Min(1, { always: true, message: 'The current page must be greater than 1.' })
    @IsInt()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, {
        always: true,
        message: 'The number of data displayed per page must be greater than 1.',
    })
    @IsInt()
    @IsOptional()
    limit = 10;
}

@DtoValidation({ groups: ['create'] })
export class CreateTagDto {
    @IsUnique(TagEntity, { groups: ['create'], message: 'The label names are repeated' })
    @IsUniqueExist(TagEntity, { groups: ['update'], message: 'The label names are repeated' })
    @MaxLength(255, {
        always: true,
        message: 'The maximum length of the label name is $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: 'The classification name cannot be empty' })
    @IsOptional({ groups: ['update'] })
    name: string;

    @MaxLength(500, {
        always: true,
        message: 'The maximum length of the label description is $constraint1',
    })
    @IsOptional({ always: true })
    desc?: string;
}

@DtoValidation({ groups: ['update'] })
export class UpdateTagDto extends PartialType(CreateTagDto) {
    @IsDataExist(TagEntity, { groups: ['update'], message: 'tag id not exist when update' })
    @IsUUID(undefined, { message: 'The ID format is incorrect', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: 'The ID must be specified' })
    id: string;
}
