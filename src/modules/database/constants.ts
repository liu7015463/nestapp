export const CUSTOM_REPOSITORY_METADATA = 'CUSTOM_REPOSITORY_METADATA';

export enum SelectTrashMode {
    /**
     * ALL: 包含已软删除和未软删除的数据（同时查询正常数据和回收站中的数据）
     */
    ALL = 'all',
    /**
     * ONLY: 只包含软删除的数据 （只查询回收站中的数据）
     */
    ONLY = 'only',

    /**
     * NONE: 只包含未软删除的数据 （只查询正常数据）
     */
    NONE = 'none',
}

export enum OrderType {
    /**
     * 升序排序
     */
    ASC = 'ASC',
    /**
     * 降序排序
     */
    DESC = 'DESC',
}

export enum TreeChildrenResolve {
    /**
     * 子信息删除
     */
    DELETE = 'delete',
    /**
     * 子信息上升层级
     */
    UP = 'up',
    /**
     * 子信息上升到顶层
     */
    ROOT = 'root',
}
