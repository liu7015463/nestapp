import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints';
import { PaginateDto } from '@/modules/restful/dtos/paginate.dto';

import { MenuEntity } from '../entities/menu.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { MenuPermissionType } from '../types';

/**
 * 查询菜单DTO
 */
@DtoValidation({ type: 'query' })
export class QueryMenuDto extends PaginateDto {
    /**
     * 父级菜单ID
     */
    @IsDataExist(MenuEntity, { message: '指定的父级菜单不存在' })
    @IsUUID(undefined, { message: '父级菜单ID格式错误' })
    @IsOptional()
    parentId?: string;

    /**
     * 权限类型
     */
    @IsEnum(MenuPermissionType, { message: '权限类型格式错误' })
    @IsOptional()
    type?: MenuPermissionType;

    /**
     * 是否隐藏
     */
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: '隐藏状态必须为布尔值' })
    @IsOptional()
    hidden?: boolean;

    /**
     * 是否禁用
     */
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: '禁用状态必须为布尔值' })
    @IsOptional()
    disabled?: boolean;
}

/**
 * 创建菜单DTO
 */
@DtoValidation({ groups: ['create'] })
export class CreateMenuDto {
    /**
     * 菜单名称
     */
    @MaxLength(50, { message: '菜单名称长度不能超过50个字符' })
    @IsString({ message: '菜单名称必须为字符串' })
    name: string;

    /**
     * 菜单编码
     */
    @MaxLength(50, { message: '菜单编码长度不能超过50个字符' })
    @IsString({ message: '菜单编码必须为字符串' })
    code: string;

    /**
     * 父级菜单ID
     */
    @IsDataExist(MenuEntity, { message: '指定的父级菜单不存在' })
    @IsUUID(undefined, { message: '父级菜单ID格式错误' })
    @IsOptional()
    parentId?: string;

    /**
     * 菜单路径
     */
    @MaxLength(200, { message: '菜单路径长度不能超过200个字符' })
    @IsString({ message: '菜单路径必须为字符串' })
    @IsOptional()
    path?: string;

    /**
     * 菜单图标
     */
    @MaxLength(50, { message: '菜单图标长度不能超过50个字符' })
    @IsString({ message: '菜单图标必须为字符串' })
    @IsOptional()
    icon?: string;

    /**
     * 菜单标题
     */
    @MaxLength(100, { message: '菜单标题长度不能超过100个字符' })
    @IsString({ message: '菜单标题必须为字符串' })
    @IsOptional()
    caption?: string;

    /**
     * 菜单信息
     */
    @MaxLength(200, { message: '菜单信息长度不能超过200个字符' })
    @IsString({ message: '菜单信息必须为字符串' })
    @IsOptional()
    info?: string;

    /**
     * 是否禁用
     */
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: '禁用状态必须为布尔值' })
    @IsOptional()
    disabled?: boolean = false;

    /**
     * 是否隐藏
     */
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: '隐藏状态必须为布尔值' })
    @IsOptional()
    hidden?: boolean = false;

    /**
     * 外部链接
     */
    @MaxLength(500, { message: '外部链接长度不能超过500个字符' })
    @IsString({ message: '外部链接必须为字符串' })
    @IsOptional()
    externalLink?: string;

    /**
     * 组件
     */
    @MaxLength(100, { message: '组件长度不能超过100个字符' })
    @IsString({ message: '组件必须为字符串' })
    @IsOptional()
    component?: string;

    /**
     * 排序
     */
    @Transform(({ value }) => toNumber(value))
    @IsOptional()
    customOrder?: number = 0;

    /**
     * 权限类型
     */
    @IsEnum(MenuPermissionType, { message: '权限类型格式错误' })
    @IsOptional()
    type?: MenuPermissionType = MenuPermissionType.MENU;

    /**
     * 关联权限ID
     */
    @IsDataExist(PermissionEntity, { message: '指定的权限不存在' })
    @IsUUID(undefined, { message: '权限ID格式错误' })
    @IsOptional()
    permissionId?: string;
}

/**
 * 更新菜单DTO
 */
@DtoValidation({ groups: ['update'] })
export class UpdateMenuDto extends PartialType(CreateMenuDto) {
    /**
     * 待更新的菜单ID
     */
    @IsDataExist(MenuEntity, { groups: ['update'], message: '菜单不存在' })
    @IsUUID(undefined, { message: '菜单ID格式错误', groups: ['update'] })
    @IsDefined({ groups: ['update'], message: '菜单ID必须指定' })
    id: string;
}
