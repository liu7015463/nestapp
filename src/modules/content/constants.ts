export enum PostBodyType {
    /**
     * HTML格式
     */
    HTML = 'html',
    /**
     * Markdown格式
     */
    MD = 'markdown',
}

export enum PostOrder {
    /**
     * 最新创建
     */
    CREATED = 'createdAt',
    /**
     * 最新创建
     */
    UPDATED = 'updatedAt',
    /**
     * 最新发布
     */
    PUBLISHED = 'publishedAt',
    /**
     * 评论数量
     */
    COMMENTCOUNT = 'commentCount',
    /**
     * 自定义排序
     */
    CUSTOM = 'custom',
}

export const DEFAULT_VALIDATION_CONFIG = Object.freeze({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false },
});
