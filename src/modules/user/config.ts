import { get, isNil, toNumber } from 'lodash';

import { Configure } from '@/modules/config/configure';
import { ConfigureFactory, ConfigureRegister } from '@/modules/config/types';
import { UserConfig } from '@/modules/user/types';

/**
 * 默认用户配置
 * @param configure
 */
export function defaultUserConfig(configure: Configure): UserConfig {
    return {
        hash: 10,
        jwt: {
            tokenExpired: configure.env.get('USER_TOKEN_EXPIRED', (v) => toNumber(v), 1800),
            refreshTokenExpired: configure.env.get(
                'USER_REFRESH_TOKEN_EXPIRED',
                (v) => toNumber(v),
                3600 * 30,
            ),
        },
        captcha: {
            phone: {
                login: {
                    template: configure.env.get('SMS_LOGIN_CAPTCHA_CLOUD', 'your-id'),
                    expired: configure.env.get('SMS_LOGIN_CAPTCHA_EXPIRED', (v) => toNumber(v), 60),
                    limit: configure.env.get('SMS_LOGIN_CAPTCHA_LIMIT', (v) => toNumber(v), 60),
                },
                register: {
                    template: configure.env.get('SMS_REGISTER_CAPTCHA_CLOUD', 'your-id'),
                },
                'retrieve-password': {
                    template: configure.env.get('SMS_RETRIEVE_PASSWORD_CAPTCHA_CLOUD', 'your-id'),
                },
            },
            email: {
                login: {
                    template: configure.env.get('EMAIL_LOGIN_CAPTCHA_TEMPLATE', undefined),
                    expired: configure.env.get(
                        'EMAIL_LOGIN_CAPTCHA_EXPIRED',
                        (v) => toNumber(v),
                        300,
                    ),
                    limit: configure.env.get('EMAIL_LOGIN_CAPTCHA_LIMIT', (v) => toNumber(v), 60),
                    subject: configure.env.get(
                        'EMAIL_LOGIN_CAPTCHA_SUBJECT',
                        '【TANK-WEB】登录验证码',
                    ),
                },
                register: {},
                'retrieve-password': {},
            },
        },
    };
}

/**
 * 用户配置创建函数
 * @param register
 */
export const createUserConfig: (
    register: ConfigureRegister<RePartial<UserConfig>>,
) => ConfigureFactory<UserConfig> = (register) => ({
    register,
    defaultRegister: defaultUserConfig,
});

/**
 * 获取user模块配置的值
 * @param configure
 * @param key
 */
export async function getUserConfig<T>(configure: Configure, key?: string): Promise<T> {
    const userConfig = await configure.get<UserConfig>('user', defaultUserConfig(configure));
    if (isNil(key)) {
        return userConfig as T;
    }
    return get(userConfig, key) as T;
}
