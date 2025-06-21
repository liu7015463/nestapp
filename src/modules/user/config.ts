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
            token_expired: configure.env.get('USER_TOKEN_EXPIRED', (v) => toNumber(v), 1800),
            refresh_token_expired: configure.env.get(
                'USER_REFRESH_TOKEN_EXPIRED',
                (v) => toNumber(v),
                3600 * 30,
            ),
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
