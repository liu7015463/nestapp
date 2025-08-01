import { OmitType, PickType } from '@nestjs/swagger';

import { Length } from 'class-validator';

import { IsPassword } from '@/modules/core/constraints/password.constraint';
import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { UserCommonDto } from '@/modules/user/dtos/user.common.dto';

import { CaptchaDtoGroups, UserValidateGroup } from '../constants';

/**
 * 更新用户信息
 */
@DtoValidation({ groups: [UserValidateGroup.ACCOUNT_UPDATE], whitelist: false })
export class UpdateAccountDto extends PickType(UserCommonDto, ['username', 'nickname']) {}

/**
 * 更改用户密码
 */
@DtoValidation({ groups: [UserValidateGroup.CHANGE_PASSWORD] })
export class UpdatePasswordDto extends PickType(UserCommonDto, ['password', 'plainPassword']) {
    /**
     * 旧密码:用户在更改密码时需要输入的原密码
     */
    @IsPassword(5, { message: '密码必须由小写字母,大写字母,数字以及特殊字符组成', always: true })
    @Length(8, 50, { message: '密码长度不得少于$constraint1', always: true })
    oldPassword: string;
}

/**
 * 对手机/邮箱绑定验证码进行验证
 */
export class AccountBoundDto extends PickType(UserCommonDto, ['code', 'phone', 'email']) {}

/**
 * 绑定或更改手机号验证
 */
@DtoValidation({ groups: [CaptchaDtoGroups.BOUND_PHONE] })
export class PhoneBoundDto extends OmitType(AccountBoundDto, ['email'] as const) {}

/**
 * 绑定或更改邮箱验证
 */
@DtoValidation({ groups: [CaptchaDtoGroups.BOUND_EMAIL] })
export class EmailBoundDto extends OmitType(AccountBoundDto, ['phone'] as const) {}
