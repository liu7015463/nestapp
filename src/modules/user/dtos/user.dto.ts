import { PartialType, PickType } from '@nestjs/swagger';

import { IsDefined, IsEnum, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { PaginateWithTrashedDto } from '@/modules/restful/dtos/paginate-width-trashed.dto';
import { UserOrderType } from '@/modules/user/constants';
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
]) {}

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
     * 排序规则:可指定用户列表的排序规则,默认为按创建时间降序排序
     */
    @IsEnum(UserOrderType)
    orderBy?: UserOrderType;
}
