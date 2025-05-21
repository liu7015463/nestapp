export enum PostBodyType {
    HTML = 'html',
    MD = 'markdown',
}

export enum PostOrder {
    CREATED = 'createdAt',
    UPDATED = 'updatedAt',
    PUBLISHED = 'publishedAt',
    COMMENTCOUNT = 'commentCount',
    CUSTOM = 'custom',
}

export const DEFAULT_VALIDATION_CONFIG = Object.freeze({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false },
});
