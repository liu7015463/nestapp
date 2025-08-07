import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { MenuEntity } from '../entities/menu.entity';

@CustomRepository(MenuEntity)
export class MenuRepository extends BaseRepository<MenuEntity> {
    protected _qbName: string = 'menu';

    buildBaseQB(): SelectQueryBuilder<MenuEntity> {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.permission`, 'permission')
            .leftJoinAndSelect(`${this.qbName}.parent`, 'parent');
    }

    /**
     * 根据权限名称查找菜单
     */
    async findByPermissionName(permissionName: string): Promise<MenuEntity | null> {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.permission`, 'permission')
            .where('permission.name = :permissionName', { permissionName })
            .getOne();
    }

    /**
     * 根据菜单编码查找菜单
     */
    async findByCode(code: string): Promise<MenuEntity | null> {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.permission`, 'permission')
            .where(`${this.qbName}.code = :code`, { code })
            .getOne();
    }

    /**
     * 获取菜单树结构
     */
    async getMenuTree(): Promise<MenuEntity[]> {
        const menus = await this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.permission`, 'permission')
            .orderBy(`${this.qbName}.customOrder`, 'ASC')
            .addOrderBy(`${this.qbName}.createdAt`, 'ASC')
            .getMany();

        return this.buildTree(menus);
    }

    /**
     * 根据父级ID获取子菜单
     */
    async findByParentId(parentId?: string): Promise<MenuEntity[]> {
        const qb = this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.permission`, 'permission')
            .orderBy(`${this.qbName}.customOrder`, 'ASC')
            .addOrderBy(`${this.qbName}.createdAt`, 'ASC');

        if (parentId) {
            qb.where(`${this.qbName}.parentId = :parentId`, { parentId });
        } else {
            qb.where(`${this.qbName}.parentId IS NULL`);
        }

        return qb.getMany();
    }

    /**
     * 构建菜单树
     */
    private buildTree(menus: MenuEntity[], parentId?: string): MenuEntity[] {
        const result: MenuEntity[] = [];

        for (const menu of menus) {
            if (menu.parentId === parentId) {
                const children = this.buildTree(menus, menu.id);
                if (children.length > 0) {
                    (menu as any).children = children;
                }
                result.push(menu);
            }
        }

        return result;
    }
}
