import { PickType } from '@nestjs/swagger';

import { Length } from 'class-validator';

import { IsPassword } from '@/modules/core/constraints/password.constraint';
import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { UserCommonDto } from '@/modules/user/dtos/user.common.dto';

/**
 * 更新用户信息
 */
@DtoValidation({ whitelist: false, groups: [UserValidateGroup.ACCOUNT_UPDATE] })
export class UpdateAccountDto extends PickType(UserCommonDto, ['username', 'nickname']) {
    /**
     * 待更新的用户ID
     */
    @IsUUID(undefined, { message: '用户ID格式不正确', groups: [UserValidateGroup.USER_UPDATE] })
    @IsDefined({ groups: ['update'], message: '用户ID必须指定' })
    id: string;
}

/**
 * 更改用户密码
 */
@DtoValidation({ groups: [UserValidateGroup.CHANGE_PASSWORD] })
export class UpdatePasswordDto extends PickType(UserCommonDto, ['password', 'plainPassword']) {
    /**
     * 待更新的用户ID
     */
    @IsUUID(undefined, { message: '用户ID格式不正确', groups: [UserValidateGroup.USER_UPDATE] })
    @IsDefined({ groups: ['update'], message: '用户ID必须指定' })
    id: string;

    /**
     * 旧密码:用户在更改密码时需要输入的原密码
     */
    @IsPassword(5, { message: '密码必须由小写字母,大写字母,数字以及特殊字符组成', always: true })
    @Length(8, 50, { message: '密码长度不得少于$constraint1', always: true })
    oldPassword: string;
}
