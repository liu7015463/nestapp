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
} from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { PaginateOptions } from '@/modules/database/types';

@DtoValidation({ type: 'query' })
export class QueryTagDto implements PaginateOptions {
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
export class CreateTagDto {
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
    @IsUUID(undefined, { message: 'The ID format is incorrect', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: 'The ID must be specified' })
    id: string;
}
