/**
 * 用户请求DTO验证组
 */
export enum UserValidateGroup {
    /**
     * 创建用户验证
     */
    USER_CREATE = 'user_create',
    /**
     * 更新用户验证
     */
    USER_UPDATE = 'user_update',
    /**
     * 用户注册验证
     */
    USER_REGISTER = 'user_register',
    /**
     * 用户账户信息更新验证
     */
    ACCOUNT_UPDATE = 'account_update',
    /**
     * 用户密码更新验证
     */
    CHANGE_PASSWORD = 'change_password',
}

/**
 * 用户查询排序
 */
export enum UserOrderType {
    CREATED = 'createdAt',
    UPDATED = 'updatedAt',
}

export const TokenConst = {
    USER_TOKEN_SECRET: 'USER_TOKEN_SECRET',
    DEFAULT_USER_TOKEN_SECRET: 'my-access-secret',
    USER_REFRESH_TOKEN_EXPIRED: 'USER_REFRESH_TOKEN_EXPIRED',
    DEFAULT_USER_REFRESH_TOKEN_EXPIRED: 'my-refresh-secret',
};

export const ALLOW_GUEST = 'allowGuest';

/**
 * 验证码发送数据DTO验证组
 */
export enum CaptchaDtoGroups {
    // 发送短信登录验证码
    PHONE_LOGIN = 'phone-login',
    // 发送邮件登录验证码
    EMAIL_LOGIN = 'email-login',
    // 发送短信注册验证码
    PHONE_REGISTER = 'phone-register',
    // 发送邮件注册验证码
    EMAIL_REGISTER = 'email-register',
    // 发送找回密码的短信验证码
    PHONE_RETRIEVE_PASSWORD = 'phone-retrieve-password',
    // 发送找回密码的邮件验证码
    EMAIL_RETRIEVE_PASSWORD = 'email-retrieve-password',
    // 发送登录用户密码重置的短信验证码
    PHONE_RESET_PASSWORD = 'phone-reset-password',
    // 发送登录用户密码重置的邮件验证码
    EMAIL_RESET_PASSWORD = 'email-reset-password',
    // 发送手机号绑定或更改的短信验证码
    BOUND_PHONE = 'bound-phone',
    // 发送邮箱地址绑定或更改的邮件验证码
    BOUND_EMAIL = 'bound-email',
}

/**
 * 验证码操作类别
 */
export enum CaptchaActionType {
    // 登录操作
    LOGIN = 'login',
    // 注册操作
    REGISTER = 'register',
    // 找回密码操作
    RETRIEVE_PASSWORD = 'retrieve-password',
    // 重置密码操作
    RESET_PASSWORD = 'reset-password',
    // 手机号或邮箱地址绑定操作
    ACCOUNT_BOUND = 'account-bound',
}

/**
 * 验证码类型
 */
export enum CaptchaType {
    SMS = 'sms',
    EMAIL = 'email',
}

/**
 * 发送验证码异步列队名称
 */
export const SEND_CAPTCHA_QUEUE = 'send-captcha-queue';

/**
 * 发送短信验证码任务处理名称
 */
export const SMS_CAPTCHA_JOB = 'sms-captcha-job';

/**
 * 发送邮件验证码任务处理名称
 */
export const EMAIL_CAPTCHA_JOB = 'mail-captcha-job';
