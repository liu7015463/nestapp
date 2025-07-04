import { OmitType, PartialType, PickType } from '@nestjs/swagger';

import { IsDefined, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { IsDataExist } from '@/modules/database/constraints';
import { PermissionEntity, RoleEntity } from '@/modules/rbac/entities';
import { PaginateWithTrashedDto } from '@/modules/restful/dtos/paginate-width-trashed.dto';
import { UserOrderType, UserValidateGroup } from '@/modules/user/constants';
import { UserCommonDto } from '@/modules/user/dtos/user.common.dto';

/**
 * 创建用户
 */
@DtoValidation({ groups: [UserValidateGroup.USER_CREATE] })
export class CreateUserDto extends PickType(UserCommonDto, [
    'username',
    'nickname',
    'email',
    'password',
    'phone',
]) {
    /**
     * 用户关联的角色ID列表
     */
    @IsDataExist(RoleEntity, {
        each: true,
        always: true,
        message: '角色不存在',
    })
    @IsUUID(undefined, {
        each: true,
        always: true,
        message: '角色ID格式不正确',
    })
    @IsOptional({ always: true })
    roles?: string[];

    /**
     * 用户直接关联的权限ID列表
     */
    @IsDataExist(PermissionEntity, {
        each: true,
        always: true,
        message: '权限不存在',
    })
    @IsUUID(undefined, {
        each: true,
        always: true,
        message: '权限ID格式不正确',
    })
    @IsOptional({ always: true })
    permissions?: string[];
}

/**
 * 更新用户
 */
@DtoValidation({ groups: [UserValidateGroup.USER_UPDATE] })
export class UpdateUserDto extends PartialType(CreateUserDto) {
    /**
     * 待更新的用户ID
     */
    @IsUUID(undefined, { message: '用户ID格式不正确', groups: [UserValidateGroup.USER_UPDATE] })
    @IsDefined({ groups: ['update'], message: '用户ID必须指定' })
    id: string;
}

/**
 * 查询用户列表的Query数据验证
 */
export class QueryUserDto extends PaginateWithTrashedDto {
    /**
     * 角色ID:根据角色来过滤用户
     */
    @IsDataExist(RoleEntity, {
        message: '角色不存在',
    })
    @IsUUID(undefined, { message: '角色ID格式错误' })
    @IsOptional()
    role?: string;

    /**
     * 权限ID:根据权限来过滤用户(权限包含用户关联的所有角色的权限以及直接关联的权限)
     */
    @IsDataExist(PermissionEntity, {
        message: '权限不存在',
    })
    @IsUUID(undefined, { message: '权限ID格式错误' })
    @IsOptional()
    permission?: string;

    /**
     * 排序规则:可指定用户列表的排序规则,默认为按创建时间降序排序
     */
    @IsEnum(UserOrderType)
    @IsOptional()
    orderBy?: UserOrderType;
}

/**
 * 客户端查询用户
 */
@DtoValidation({ type: 'query' })
export class FrontedQueryUserDto extends OmitType(QueryUserDto, ['trashed']) {}
