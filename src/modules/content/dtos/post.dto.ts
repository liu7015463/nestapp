import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import {
    IsBoolean,
    IsDefined,
    IsEnum,
    IsInt,
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
import { SelectTrashMode } from '@/modules/database/constants';
import { IsDataExist } from '@/modules/database/constraints/data.exist.constraint';
import { PaginateOptions } from '@/modules/database/types';

import { UserEntity } from '@/modules/user/entities';

import { CategoryEntity, PostEntity, TagEntity } from '../entities';

/**
 * 文章分页查询验证
 */
@DtoValidation({ type: 'query' })
export class QueryPostDto implements PaginateOptions {
    /**
     * 是否查询已发布(全部文章:不填、只查询已发布的:true、只查询未发布的:false)
     */
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    /**
     * 全文搜索
     */
    @MaxLength(100, {
        always: true,
        message: '搜索字符串长度不得超过$constraint1',
    })
    @IsOptional()
    search?: string;

    /**
     * 查询结果排序,不填则综合排序
     */
    @IsEnum(PostOrder, {
        message: `The sorting rule must be one of ${Object.values(PostOrder).join(',')}`,
    })
    @IsOptional()
    orderBy?: PostOrder;

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

    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;

    /**
     * 根据分类ID查询此分类及其后代分类下的文章
     */
    @IsDataExist(CategoryEntity, { always: true, message: 'The category does not exist' })
    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsOptional()
    category?: string;

    /**
     * 根据标签ID查询
     */
    @IsUUID(undefined, { message: 'The ID format is incorrect' })
    @IsOptional()
    tag?: string;

    /**
     * 根据文章作者ID查询
     */
    @IsDataExist(UserEntity, {
        message: '指定的用户不存在',
    })
    @IsUUID(undefined, { message: '用户ID格式错误' })
    @IsOptional()
    author?: string;
}

@DtoValidation({ groups: ['create'] })
export class CreatePostDto {
    /**
     * 文章标题
     */
    @MaxLength(255, {
        always: true,
        message: 'The maximum length of the article title is $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: 'The article title must be filled in.' })
    @IsOptional({ groups: ['update'] })
    title: string;

    /**
     * 文章内容
     */
    @IsNotEmpty({ groups: ['create'], message: 'The content of the article must be filled in.' })
    @IsOptional({ groups: ['update'] })
    body: string;

    /**
     * 文章描述
     */
    @MaxLength(500, {
        always: true,
        message: 'The maximum length of the article description is $constraint1',
    })
    @IsOptional({ always: true })
    summary?: string;

    /**
     * 是否发布(发布时间)
     */
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean({ always: true })
    @ValidateIf((value) => !isNil(value.publish))
    @IsOptional({ always: true })
    publish?: boolean;

    /**
     * SEO关键字
     */
    @MaxLength(20, {
        always: true,
        each: true,
        message: 'The maximum length of each keyword is $constraint1',
    })
    @IsOptional({ always: true })
    keywords?: string[];

    /**
     * 自定义排序
     */
    @Transform(({ value }) => toNumber(value))
    @Min(0, { message: 'The sorted value must be greater than 0.', always: true })
    @IsInt({ always: true })
    @IsOptional({ always: true })
    customOrder?: number;

    /**
     * 所属分类ID
     */
    @IsDataExist(CategoryEntity, { always: true, message: 'The category does not exist' })
    @IsUUID(undefined, {
        always: true,
        message: 'The ID format is incorrect',
    })
    @IsOptional({ always: true })
    category?: string;

    /**
     * 关联标签ID
     */
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

    /**
     * 文章作者ID:可用于在管理员发布文章时分配给其它用户,如果不设置,则作者为当前管理员
     */
    @IsDataExist(UserEntity, {
        always: true,
        message: '用户不存在',
    })
    @IsUUID(undefined, {
        always: true,
        message: '用户ID格式不正确',
    })
    @IsOptional({ always: true })
    author?: string;
}

/**
 * 文章更新验证
 */
@DtoValidation({ groups: ['update'] })
export class UpdatePostDto extends PartialType(CreatePostDto) {
    /**
     * 待更新ID
     */
    @IsUUID(undefined, {
        groups: ['update'],
        message: 'The format of the article ID is incorrect.',
    })
    @IsDefined({ groups: ['update'], message: 'The article ID must be specified' })
    @IsDataExist(PostEntity, { groups: ['update'], message: 'post id not exist when update' })
    id: string;
}

/**
 * 客户端查询文章列表验证
 */
@DtoValidation({ type: 'query' })
export class FrontendQueryPostDto extends OmitType(QueryPostDto, ['isPublished', 'trashed']) {}

/**
 * 客户端创建文章验证
 */
@DtoValidation({ groups: ['create'] })
export class FrontendCreatePostDto extends OmitType(CreatePostDto, ['author', 'customOrder']) {
    /**
     * 用户侧排序:文章在用户的文章管理而非后台中,列表的排序规则
     */
    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: '排序值必须大于0' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    userOrder?: number = 0;
}

/**
 * 用户文章更新验证
 */
@DtoValidation({ groups: ['update'] })
export class OwnerUpdatePostDto extends OmitType(UpdatePostDto, ['author', 'customOrder']) {
    /**
     * 用户侧排序:文章在用户的文章管理而非后台中,列表的排序规则
     */
    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: '排序值必须大于0' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    userOrder?: number = 0;
}

/**
 * 用户查询自己的文章列表验证
 */
@DtoValidation({ type: 'query' })
export class OwnerQueryPostDto extends OmitType(QueryPostDto, ['author']) {}
