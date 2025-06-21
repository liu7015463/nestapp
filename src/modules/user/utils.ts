import bcrypt from 'bcrypt';

import { Configure } from '@/modules/config/configure';
import { getUserConfig } from '@/modules/user/config';

/**
 * 加密明文密码
 * @param configure
 * @param password
 */
export async function encrypt(configure: Configure, password: string) {
    const hash: number = (await getUserConfig<number>(configure, 'hash')) || 10;
    return bcrypt.hashSync(password, hash);
}

/**
 * 验证密码
 * @param password
 * @param hashed
 */
export function decrypt(password: string, hashed: string) {
    return bcrypt.compareSync(password, hashed);
}
