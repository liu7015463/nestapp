import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import {
    IsBoolean,
    IsDefined,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';

import { isNil, toNumber } from 'lodash';

import { PostOrder } from '@/modules/content/constants';
import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { toBoolean } from '@/modules/core/helpers';
import { IsDataExist } from '@/modules/database/constraints/data.exist.constraint';
import { PaginateOptions } from '@/modules/database/types';

import { CategoryEntity, PostEntity, TagEntity } from '../entities';

@DtoValidation({ type: 'query' })
export class QueryPostDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsEnum(PostOrder, {
        message: `The sorting rule must be one of ${Object.values(PostOrder).join(',')}`,
    })
    @IsOptional()
    orderBy: PostOrder;

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

    @IsDataExist(CategoryEntity, { always: true, message: 'The category does not exist' })
    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsOptional()
    category?: string;

    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsOptional()
    tag?: string;
}

@DtoValidation({ groups: ['create'] })
export class CreatePostDto {
    @MaxLength(255, {
        always: true,
        message: 'The maximum length of the article title is $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: 'The article title must be filled in.' })
    @IsOptional({ groups: ['update'] })
    title: string;

    @IsNotEmpty({ groups: ['create'], message: 'The content of the article must be filled in.' })
    @IsOptional({ groups: ['update'] })
    body: string;

    @MaxLength(500, {
        always: true,
        message: 'The maximum length of the article description is $constraint1',
    })
    @IsOptional({ always: true })
    summary?: string;

    @Transform(({ value }) => toBoolean(value))
    @IsBoolean({ always: true })
    @ValidateIf((value) => !isNil(value.publish))
    @IsOptional({ always: true })
    publish?: boolean;

    @MaxLength(20, {
        always: true,
        each: true,
        message: 'The maximum length of each keyword is $constraint1',
    })
    @IsOptional({ always: true })
    keywords?: string[];

    @Transform(({ value }) => toNumber(value))
    @Min(0, { message: 'The sorted value must be greater than 0.' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder?: number;

    @IsDataExist(CategoryEntity, { always: true, message: 'The category does not exist' })
    @IsUUID(undefined, {
        always: true,
        message: 'The ID format is incorrect',
    })
    @IsOptional({ always: true })
    category?: string;

    @IsDataExist(TagEntity, {
        always: true,
        each: true,
        message: 'The tag does not exist',
    })
    @IsUUID(undefined, {
        always: true,
        each: true,
        message: 'The ID format is incorrect',
    })
    @IsOptional({ always: true })
    tags?: string[];
}

@DtoValidation({ groups: ['update'] })
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, {
        groups: ['update'],
        message: 'The format of the article ID is incorrect.',
    })
    @IsDefined({ groups: ['update'], message: 'The article ID must be specified' })
    @IsDataExist(PostEntity, { groups: ['update'], message: 'post id not exist when update' })
    id: string;
}
