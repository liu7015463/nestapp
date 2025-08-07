import { AbilityTuple, MongoAbility, MongoQuery, RawRuleFrom } from '@casl/ability';

import { ModuleRef } from '@nestjs/core';

import { FastifyRequest as Request } from 'fastify';

import { UserEntity } from '../user/entities';

import { UserRepository } from '../user/repositories';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { RbacResolver } from './rbac.resolver';

/**
 * 菜单权限类型枚举
 */
export enum MenuPermissionType {
    /** 分组 */
    GROUP = 0,
    /** 目录  */
    CATALOGUE = 1,
    /** 菜单 */
    MENU = 2,
    /** 页面 */
    COMPONENT = 3,
    /** 功能 */
    FUNCTION = 4,
    /** 按钮 */
    BUTTON = 5,
}

/**
 * 导航项数据属性
 */
export interface NavItemDataProps {
    /** 路径 */
    path?: string;
    /** 图标 */
    icon?: string;
    /** 标题 */
    caption?: string;
    /** 信息 */
    info?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 权限 */
    auth?: string[];
    /** 是否隐藏 */
    hidden?: boolean;
}

/**
 * 菜单元信息
 */
export type MenuMetaInfo = Partial<
    Pick<NavItemDataProps, 'path' | 'icon' | 'caption' | 'info' | 'disabled' | 'auth' | 'hidden'>
> & {
    /** 外部链接 */
    externalLink?: string;
    /** 组件 */
    component?: string;
};

/**
 * 菜单接口
 */
export interface Menu extends MenuMetaInfo {
    /** 菜单ID */
    id: string;
    /** 父级菜单ID */
    parentId?: string;
    /** 菜单名称 */
    name: string;
    /** 菜单编码 */
    code: string;
    /** 关联权限 */
    permission?: PermissionEntity;
    /** 排序 */
    customOrder?: number;
    /** 权限类型 */
    type: MenuPermissionType;
}

export type Role = Pick<ClassToPlain<RoleEntity>, 'name' | 'label' | 'description'> & {
    permissions: string[];
};

export type PermissionType<P extends AbilityTuple, T extends MongoQuery> = Pick<
    ClassToPlain<PermissionEntity<P, T>>,
    'name'
> &
    Partial<Pick<ClassToPlain<PermissionEntity<P, T>>, 'label' | 'description'>> & {
        rule: Omit<RawRuleFrom<P, T>, 'conditions'> & {
            conditions?: (user: ClassToPlain<UserEntity>) => RecordAny;
        };
    };

export type PermissionChecker = (
    ability: MongoAbility,
    ref?: ModuleRef,
    request?: Request,
) => Promise<boolean>;

export type CheckerParams = {
    resolver: RbacResolver;
    repository: UserRepository;
    checkers: PermissionChecker[];
    moduleRef?: ModuleRef;
    request?: any;
};
