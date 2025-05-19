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
import { toBoolean } from '@/modules/core/helpers';
import { PaginateOptions } from '@/modules/database/types';

export class QueryPostDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsEnum(PostOrder, { message: `` })
    @IsOptional()
    orderBy: PostOrder;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}

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
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, {
        groups: ['update'],
        message: 'The format of the article ID is incorrect.',
    })
    @IsDefined({ groups: ['update'], message: 'The article ID must be specified' })
    id: string;
}
