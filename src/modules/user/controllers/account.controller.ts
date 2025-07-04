import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Request,
    SerializeOptions,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { pick } from 'lodash';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { UserIdInterceptor } from '@/modules/user/interceptors';

import { Guest } from '../decorators/guest.decorator';
import { RequestUser } from '../decorators/user.request.decorator';
import { UpdateAccountDto, UpdatePasswordDto } from '../dtos/account.dto';
import { CredentialDto, RegisterDto } from '../dtos/auth.dto';
import { UserEntity } from '../entities/user.entity';
import { LocalAuthGuard } from '../guards/local.auth.guard';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UserModule } from '../user.module';

@ApiTags('账户操作')
@Depends(UserModule)
@Controller('account')
export class AccountController {
    constructor(
        protected authService: AuthService,
        protected userService: UserService,
    ) {}

    /**
     * 使用用户名密码注册用户
     * @param data
     */
    @Post('register')
    @Guest()
    async register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    /**
     * 用户登录[凭证(可以是用户名,邮箱,手机号等)+密码登录]
     * @param user
     * @param _data
     */
    @Post('login')
    @Guest()
    @UseGuards(LocalAuthGuard)
    async login(@RequestUser() user: ClassToPlain<UserEntity>, @Body() _data: CredentialDto) {
        return { token: await this.authService.createToken(user.id) };
    }

    /**
     * 注销登录
     * @param req
     */
    @Post('logout')
    @ApiBearerAuth()
    async logout(@Request() req: any) {
        return this.authService.logout(req);
    }

    /**
     * 获取账户信息[只有用户自己才能查询]
     * @param user
     */
    @Get('profile')
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['user-detail'] })
    async profile(@RequestUser() user: ClassToPlain<UserEntity>) {
        return this.userService.detail(user.id);
    }

    /**
     * 更改账户信息
     * @param user
     * @param data
     */
    @Patch()
    @ApiBearerAuth()
    @UseInterceptors(UserIdInterceptor)
    @SerializeOptions({ groups: ['user-detail'] })
    async update(
        @RequestUser() user: ClassToPlain<UserEntity>,
        @Body()
        data: UpdateAccountDto,
    ) {
        return this.userService.update({ id: user.id, ...pick(data, ['username', 'nickname']) });
    }

    /**
     * 修改密码[必须知道原密码]
     * @param user
     * @param data
     */
    @Patch('change-password')
    @ApiBearerAuth()
    @SerializeOptions({ groups: ['user-detail'] })
    async changePassword(
        @RequestUser() user: ClassToPlain<UserEntity>,
        @Body() data: UpdatePasswordDto,
    ) {
        return this.authService.changePassword(user, data);
    }
}
