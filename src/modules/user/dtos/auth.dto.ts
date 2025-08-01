import { PickType } from '@nestjs/swagger';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { CaptchaDtoGroups, UserValidateGroup } from '@/modules/user/constants';
import { UserCommonDto } from '@/modules/user/dtos/user.common.dto';

/**
 * 用户正常方式登录
 */
export class CredentialDto extends PickType(UserCommonDto, ['credential', 'password']) {}

/**
 * 通过手机验证码登录
 */
@DtoValidation({ groups: [CaptchaDtoGroups.PHONE_LOGIN] })
export class PhoneLoginDto extends PickType(UserCommonDto, ['phone', 'code'] as const) {}

/**
 * 通过邮箱验证码登录
 */
@DtoValidation({ groups: [CaptchaDtoGroups.EMAIL_LOGIN] })
export class EmailLoginDto extends PickType(UserCommonDto, ['email', 'code'] as const) {}

/**
 * 普通方式注册用户
 */
@DtoValidation({ groups: [UserValidateGroup.USER_REGISTER] })
export class RegisterDto extends PickType(UserCommonDto, [
    'username',
    'nickname',
    'password',
    'plainPassword',
] as const) {}

/**
 * 通过手机验证码注册
 */
@DtoValidation({ groups: [CaptchaDtoGroups.PHONE_REGISTER] })
export class PhoneRegisterDto extends PickType(UserCommonDto, ['phone', 'code'] as const) {}

/**
 * 通过邮件验证码注册
 */
@DtoValidation({ groups: [CaptchaDtoGroups.EMAIL_REGISTER] })
export class EmailRegisterDto extends PickType(UserCommonDto, ['email', 'code'] as const) {}

/**
 * 通过登录凭证找回密码
 */
export class RetrievePasswordDto extends PickType(UserCommonDto, [
    'credential',
    'code',
    'password',
    'plainPassword',
] as const) {}

/**
 * 通过手机号找回密码
 */
@DtoValidation({ groups: [CaptchaDtoGroups.EMAIL_RETRIEVE_PASSWORD] })
export class PhoneRetrievePasswordDto extends PickType(UserCommonDto, [
    'phone',
    'code',
    'password',
    'plainPassword',
] as const) {}

/**
 * 通过邮箱地址找回密码
 */
@DtoValidation({ groups: [CaptchaDtoGroups.EMAIL_RETRIEVE_PASSWORD] })
export class EmailRetrievePasswordDto extends PickType(UserCommonDto, [
    'email',
    'code',
    'password',
    'plainPassword',
] as const) {}
