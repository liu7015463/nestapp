import { Body, Controller, Patch, Post, SerializeOptions } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depend.decorator';

import { CaptchaActionType, CaptchaType } from '../constants';
import { Guest } from '../decorators/guest.decorator';
import { RequestUser } from '../decorators/user.request.decorator';
import { EmailBoundDto, PhoneBoundDto } from '../dtos/account.dto';
import {
    EmailLoginDto,
    EmailRegisterDto,
    EmailRetrievePasswordDto,
    PhoneLoginDto,
    PhoneRegisterDto,
    PhoneRetrievePasswordDto,
    RetrievePasswordDto,
} from '../dtos/auth.dto';
import {
    BoundEmailCaptchaDto,
    BoundPhoneCaptchaDto,
    CredentialCaptchaMessageDto,
    LoginEmailCaptchaDto,
    LoginPhoneCaptchaDto,
    RegisterEmailCaptchaDto,
    RegisterPhoneCaptchaDto,
    RetrievePasswordEmailCaptchaDto,
    RetrievePasswordPhoneCaptchaDto,
} from '../dtos/captcha.dto';
import { UserEntity } from '../entities';
import { AuthService } from '../services';
import { CaptchaQueueService } from '../services/captcha/queue.service';
import { UserModule } from '../user.module';

@ApiTags('账户操作')
@Depends(UserModule)
@ApiBearerAuth()
@Controller('account')
export class CaptchaController {
    constructor(
        private readonly authService: AuthService,
        private readonly captchaQueueService: CaptchaQueueService,
    ) {}

    /**
     * 发送邮件绑定验证码
     * @param data
     */
    @ApiOperation({ summary: '绑定或换绑邮箱' })
    @Post('send-email-bound')
    async sendEmailBound(@Body() data: BoundEmailCaptchaDto) {
        return this.captchaQueueService.send({
            data,
            action: CaptchaActionType.ACCOUNT_BOUND,
            type: CaptchaType.EMAIL,
            message: 'can not send email for bind',
        });
    }

    /**
     * 绑定或更改邮箱
     * @param user
     * @param data
     */
    @Patch('email-bound')
    @ApiOperation({ summary: '绑定或换绑邮箱' })
    @SerializeOptions({
        groups: ['user-detail'],
    })
    async boundEmail(
        @RequestUser() user: ClassToPlain<UserEntity>,
        @Body() data: EmailBoundDto,
    ): Promise<UserEntity> {
        return this.authService.boundCaptcha(user, {
            ...data,
            type: CaptchaType.EMAIL,
            value: data.email,
        });
    }

    /**
     * 发送登录验证码邮件
     * @param data
     */
    @Post('send-email-login-captcha')
    @ApiOperation({ summary: '发送登录验证码邮件' })
    @Guest()
    async sendLoginEmail(
        @Body()
        data: LoginEmailCaptchaDto,
    ) {
        return this.captchaQueueService.sendByCredential({
            ...data,
            credential: data.email,
            action: CaptchaActionType.LOGIN,
            type: CaptchaType.EMAIL,
        });
    }

    /**
     * 通过邮件验证码登录
     * @param param0
     */
    @Post('email-login')
    @ApiOperation({ summary: '用户通过邮箱+验证码' })
    @Guest()
    async loginByEmail(@Body() { email, code }: EmailLoginDto) {
        const user = await this.authService.loginByCaptcha(email, code, CaptchaType.EMAIL);
        return { token: await this.authService.createToken(user.id) };
    }

    /**
     * 发送用户注册验证码邮件
     * @param data
     */
    @Post('send-email-register-captcha')
    @ApiOperation({ summary: '发送用户注册验证码邮件' })
    @Guest()
    async sendRegisterEmail(
        @Body()
        data: RegisterEmailCaptchaDto,
    ) {
        const { result } = await this.captchaQueueService.send({
            data,
            action: CaptchaActionType.REGISTER,
            type: CaptchaType.EMAIL,
            message: 'can not send email for register user!',
        });
        return { result };
    }

    /**
     * 通过邮箱验证注册用户
     * @param data
     */
    @Post('email-register')
    @ApiOperation({ summary: '用户通过邮箱+验证码' })
    @Guest()
    async registerByEmail(
        @Body()
        data: EmailRegisterDto,
    ) {
        return this.authService.registerByCaptcha({
            ...data,
            value: data.email,
            type: CaptchaType.EMAIL,
        });
    }

    /**
     * 发送找回密码的验证码邮件
     * @param data
     */
    @Post('send-email-retrieve-password-captcha')
    @ApiOperation({ summary: '发送找回密码的验证码邮件' })
    @Guest()
    async sendRetrievePasswordEmail(
        @Body()
        data: RetrievePasswordEmailCaptchaDto,
    ) {
        return this.captchaQueueService.sendByType({
            data,
            action: CaptchaActionType.RETRIEVE_PASSWORD,
            type: CaptchaType.EMAIL,
            message: 'can not send email for reset-password!',
        });
    }

    /**
     * 通过邮件验证码找回密码
     * @param data
     */
    @Patch('email-retrieve-password')
    @ApiOperation({ summary: '通过邮件验证码找回密码' })
    @Guest()
    async retrievePasswordByEmail(
        @Body()
        data: EmailRetrievePasswordDto,
    ) {
        return this.authService.retrievePassword({
            ...data,
            value: data.email,
            type: CaptchaType.EMAIL,
        });
    }

    /**
     * 发送手机绑定验证码
     * @param data
     */
    @Post('send-phone-bound-captcha')
    @ApiOperation({ summary: '绑定或换绑手机号' })
    async sendBoundPhone(@Body() data: BoundPhoneCaptchaDto) {
        return this.captchaQueueService.send({
            data,
            action: CaptchaActionType.ACCOUNT_BOUND,
            type: CaptchaType.PHONE,
            message: 'can not send phone sms for bind phone',
        });
    }

    /**
     * 绑定或更改手机号
     * @param user
     * @param data
     */
    @ApiOperation({ summary: '重置密码' })
    @Patch('phone-bound')
    @SerializeOptions({
        groups: ['user-detail'],
    })
    async boundPhone(
        @RequestUser() user: ClassToPlain<UserEntity>,
        @Body() data: PhoneBoundDto,
    ): Promise<UserEntity> {
        return this.authService.boundCaptcha(user, {
            ...data,
            type: CaptchaType.PHONE,
            value: data.phone,
        });
    }

    /**
     * 发送登录验证码短信
     * @param data
     */
    @Post('send-phone-login-captcha')
    @ApiOperation({ summary: '发送登录验证码短信' })
    @Guest()
    async sendPhoneLoginCaptcha(
        @Body()
        data: LoginPhoneCaptchaDto,
    ) {
        return this.captchaQueueService.sendByCredential({
            ...data,
            credential: data.phone,
            action: CaptchaActionType.LOGIN,
            type: CaptchaType.PHONE,
        });
    }

    /**
     * 通过短信验证码登录
     * @param param0
     */
    @Post('phone-login')
    @ApiOperation({ summary: '用户通过手机号+验证码' })
    @Guest()
    async loginByPhone(@Body() data: PhoneLoginDto) {
        const { phone, code } = data;
        const user = await this.authService.loginByCaptcha(phone, code, CaptchaType.PHONE);
        return { token: await this.authService.createToken(user.id) };
    }

    /**
     * 发送用户注册验证码短信
     * @param data
     */
    @Post('send-phone-register-captcha')
    @ApiOperation({ summary: '发送用户注册验证码短信' })
    @Guest()
    async sendRegisterPhoneCaptcha(
        @Body()
        data: RegisterPhoneCaptchaDto,
    ) {
        const { result } = await this.captchaQueueService.send({
            data,
            action: CaptchaActionType.REGISTER,
            type: CaptchaType.PHONE,
            message: 'can not send phone sms for register user!',
        });
        return { result };
    }

    /**
     * 通过手机号验证注册用户
     * @param data
     */
    @Post('phone-register')
    @ApiOperation({ summary: '通过手机号+验证码注册账户' })
    @Guest()
    async registerByPhone(
        @Body()
        data: PhoneRegisterDto,
    ) {
        return this.authService.registerByCaptcha({
            ...data,
            value: data.phone,
            type: CaptchaType.PHONE,
        });
    }

    /**
     * 发送找回密码的验证码短信
     * @param data
     */
    @Post('send-phone-retrieve-password-captcha')
    @ApiOperation({ summary: '发送找回密码的验证码短信' })
    @Guest()
    async sendRetrievePasswordPhoneCaptcha(
        @Body()
        data: RetrievePasswordPhoneCaptchaDto,
    ) {
        return this.captchaQueueService.sendByType({
            data,
            action: CaptchaActionType.RETRIEVE_PASSWORD,
            type: CaptchaType.PHONE,
            message: 'can not send phone sms for reset-password!',
        });
    }

    /**
     * 通过短信验证码找回密码
     * @param data
     */
    @Patch('phone-retrieve-password')
    @ApiOperation({ summary: '通过短信验证码找回密码' })
    @Guest()
    async retrievePasswordByPhone(
        @Body()
        data: PhoneRetrievePasswordDto,
    ) {
        return this.authService.retrievePassword({
            ...data,
            value: data.phone,
            type: CaptchaType.PHONE,
        });
    }

    /**
     * 通过登录凭证找回密码时同时发送短信和邮件
     * @param param0
     */
    @Post('send-retrieve-password-captcha')
    @ApiOperation({ summary: '通过登录凭证找回密码时同时发送短信和邮件' })
    @Guest()
    async sendRetrievePasswordCaptcha(
        @Body()
        { credential }: CredentialCaptchaMessageDto,
    ) {
        return this.captchaQueueService.sendByCredential({
            credential,
            action: CaptchaActionType.RETRIEVE_PASSWORD,
            message: 'can not send phone sms or email for reset-password!',
        });
    }

    /**
     * 通过用户凭证(用户名,短信,邮件)发送邮件和短信验证码后找回密码
     * @param data
     */
    @Patch('retrieve-password')
    @ApiOperation({ summary: '通过对凭证绑定的手机号和邮箱同时发送验证码来找回密码' })
    @Guest()
    async retrievePassword(
        @Body()
        data: RetrievePasswordDto,
    ) {
        return this.authService.retrievePassword({
            ...data,
            value: data.credential,
        });
    }
}
