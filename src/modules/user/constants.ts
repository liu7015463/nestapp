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
