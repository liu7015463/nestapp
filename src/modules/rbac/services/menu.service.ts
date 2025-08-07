import { Injectable } from '@nestjs/common';
import { isNil, omit } from 'lodash';

import { BaseService } from '@/modules/database/base/service';

import { CreateMenuDto, UpdateMenuDto } from '../dtos/menu.dto';
import { MenuEntity } from '../entities/menu.entity';
import { MenuRepository } from '../repositories/menu.repository';
import { MenuPermissionType } from '../types';

@Injectable()
export class MenuService extends BaseService<MenuEntity, MenuRepository> {
    protected enableTrash = false;

    constructor(protected repository: MenuRepository) {
        super(repository);
    }

    /**
     * 创建菜单
     */
    async create(data: CreateMenuDto): Promise<MenuEntity> {
        const menu = this.repository.create(data);
        const item = await this.repository.save(menu);
        return this.detail(item.id);
    }

    /**
     * 更新菜单
     */
    async update(data: UpdateMenuDto): Promise<MenuEntity> {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }

    /**
     * 获取菜单树
     */
    async getMenuTree(): Promise<MenuEntity[]> {
        return this.repository.getMenuTree();
    }

    /**
     * 根据权限名称获取菜单
     */
    async findByPermissionName(permissionName: string): Promise<MenuEntity | null> {
        return this.repository.findByPermissionName(permissionName);
    }

    /**
     * 根据菜单编码获取菜单
     */
    async findByCode(code: string): Promise<MenuEntity | null> {
        return this.repository.findByCode(code);
    }

    /**
     * 根据父级ID获取子菜单
     */
    async findByParentId(parentId?: string): Promise<MenuEntity[]> {
        return this.repository.findByParentId(parentId);
    }

    /**
     * 创建或更新菜单
     */
    async createOrUpdate(data: {
        code: string;
        name: string;
        parentId?: string;
        path?: string;
        icon?: string;
        caption?: string;
        info?: string;
        disabled?: boolean;
        hidden?: boolean;
        externalLink?: string;
        component?: string;
        customOrder?: number;
        type?: MenuPermissionType;
        permissionId?: string;
    }): Promise<MenuEntity> {
        const existing = await this.findByCode(data.code);

        if (existing) {
            // 更新现有菜单
            Object.assign(existing, {
                name: data.name,
                parentId: data.parentId,
                path: data.path,
                icon: data.icon,
                caption: data.caption,
                info: data.info,
                disabled: data.disabled ?? false,
                hidden: data.hidden ?? false,
                externalLink: data.externalLink,
                component: data.component,
                customOrder: data.customOrder ?? 0,
                type: data.type ?? MenuPermissionType.MENU,
            });

            return this.repository.save(existing);
        }
        // 创建新菜单
        const menu = this.repository.create({
            code: data.code,
            name: data.name,
            parentId: data.parentId,
            path: data.path,
            icon: data.icon,
            caption: data.caption,
            info: data.info,
            disabled: data.disabled ?? false,
            hidden: data.hidden ?? false,
            externalLink: data.externalLink,
            component: data.component,
            customOrder: data.customOrder ?? 0,
            type: data.type ?? MenuPermissionType.MENU,
        });

        return this.repository.save(menu);
    }

    /**
     * 批量创建或更新菜单
     */
    async batchCreateOrUpdate(
        menuData: Array<{
            code: string;
            name: string;
            parentId?: string;
            path?: string;
            icon?: string;
            caption?: string;
            info?: string;
            disabled?: boolean;
            hidden?: boolean;
            externalLink?: string;
            component?: string;
            order?: number;
            type?: MenuPermissionType;
            permissionId?: string;
        }>,
    ): Promise<MenuEntity[]> {
        const results: MenuEntity[] = [];

        for (const data of menuData) {
            const menu = await this.createOrUpdate(data);
            results.push(menu);
        }

        return results;
    }

    /**
     * 根据用户权限获取可访问的菜单
     */
    async getAccessibleMenus(userPermissions: string[]): Promise<MenuEntity[]> {
        const allMenus = await this.getMenuTree();
        return this.filterMenusByPermissions(allMenus, userPermissions);
    }

    /**
     * 根据权限过滤菜单
     */
    private filterMenusByPermissions(menus: MenuEntity[], permissions: string[]): MenuEntity[] {
        const result: MenuEntity[] = [];

        for (const menu of menus) {
            // 如果菜单没有关联权限或用户有对应权限，则包含该菜单
            if (isNil(menu.permission) || permissions.includes(menu.permission.name)) {
                // 创建一个新的菜单对象，避免类型错误
                const filteredMenu = Object.assign(
                    Object.create(Object.getPrototypeOf(menu)),
                    menu,
                );

                // 递归过滤子菜单
                if ((menu as any).children) {
                    const filteredChildren = this.filterMenusByPermissions(
                        (menu as any).children,
                        permissions,
                    );
                    if (filteredChildren.length > 0) {
                        (filteredMenu as any).children = filteredChildren;
                    }
                }

                result.push(filteredMenu);
            }
        }

        return result;
    }
}
