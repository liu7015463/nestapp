/**
 * 用户配置类型
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
}

/**
 * JWT配置类型
 */
export interface JwtConfig {
    /**
     * token过期时间
     */
    token_expired: number;
    /**
     * refresh token
     */
    refresh_token_expired: number;
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
