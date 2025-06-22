import { PickType } from '@nestjs/swagger';

import { DtoValidation } from '@/modules/core/decorator/dto.validation.decorator';
import { UserValidateGroup } from '@/modules/user/constants';
import { UserCommonDto } from '@/modules/user/dtos/user.common.dto';

/**
 * 用户正常方式登录
 */
export class CredentialDto extends PickType(UserCommonDto, ['credential', 'password']) {}

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
