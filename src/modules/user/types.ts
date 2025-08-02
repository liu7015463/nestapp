import { CaptchaActionType, CaptchaType } from '@/modules/user/constants';
import { CaptchaEntity } from '@/modules/user/entities/captcha.entity';

/**
 * 自定义用户模块配置
 */
export interface UserConfig {
    /**
     * 对密码进行混淆时的hash数量值
     */
    hash: number;
    /**
     * jwt token的生成配置
     */
    jwt: JwtConfig;

    captcha?: CustomCaptchaConfig;
}

/**
 * JWT配置类型
 */
export interface JwtConfig {
    /**
     * token过期时间
     */
    tokenExpired: number;
    /**
     * refresh token
     */
    refreshTokenExpired: number;
}

/**
 * JWT荷载签出对象
 */
export interface JwtPayload {
    /**
     * 用户ID
     */
    sub: string;
    /**
     * 签出时间
     */
    iat: number;
}

/**
 * 默认用户模块配置
 */
export interface DefaultUserConfig {
    hash: number;
    jwt: Pick<Required<JwtConfig>, 'tokenExpired' | 'refreshTokenExpired'>;
    captcha: DefaultCaptchaConfig;
}

/**
 * 自定义验证码配置
 */
export interface CustomCaptchaConfig {
    [CaptchaType.PHONE]?: {
        [key in CaptchaActionType]?: Partial<SmsCaptchaOption>;
    };
    [CaptchaType.EMAIL]?: {
        [key in CaptchaActionType]?: Partial<EmailCaptchaOption>;
    };
}

/**
 * 默认验证码配置
 */
export interface DefaultCaptchaConfig {
    [CaptchaType.PHONE]: {
        [key in CaptchaActionType]: CaptchaOption;
    };
    [CaptchaType.EMAIL]: {
        [key in CaptchaActionType]: Omit<EmailCaptchaOption, 'template'>;
    };
}

/**
 * 通用验证码选项
 */
export interface CaptchaOption {
    limit: number; // 验证码发送间隔时间
    expired: number; // 验证码有效时间
}

/**
 * 手机验证码选项
 */
export interface SmsCaptchaOption extends CaptchaOption {
    template: string; // 云厂商短信推送模板ID
}

/**
 * 邮件验证码选项
 */
export interface EmailCaptchaOption extends CaptchaOption {
    subject: string; // 邮件主题
    template?: string; // 模板路径
}

/**
 * 任务传给消费者的数据类型
 */
export interface SendCaptchaQueueJob {
    captcha: { [key in keyof CaptchaEntity]: CaptchaEntity[key] };
    option: SmsCaptchaOption | EmailCaptchaOption;
    otherVars?: RecordAny;
}

/**
 * 验证码正确性验证
 */
export type CaptchaValidate<T extends RecordAny = RecordNever> = T & {
    value: string;
    code: string;
};
