import { AbilityOptions, AbilityTuple, MongoQuery, SubjectType } from '@casl/ability';
import { InternalServerErrorException, OnApplicationBootstrap } from '@nestjs/common';

import { isArray, isNil, omit } from 'lodash';
import { DataSource, EntityManager, In, Not } from 'typeorm';

import { MenuEntity, PermissionEntity } from '@/modules/rbac/entities';

import { Configure } from '../config/configure';

import { deepMerge } from '../core/helpers';

import { UserEntity } from '../user/entities';

import { SYSTEM_PERMISSION, SystemRoles } from './constants';
import { RoleEntity } from './entities/role.entity';
import { Menu, MenuPermissionType, PermissionType, Role } from './types';

const getSubject = <R extends SubjectType>(subject: R) => {
    if (typeof subject === 'string') {
        return subject;
    }
    if (subject.modelName) {
        return subject;
    }
    return subject.name;
};

export class RbacResolver<P extends AbilityTuple = AbilityTuple, T extends MongoQuery = MongoQuery>
    implements OnApplicationBootstrap
{
    private setuped = false;

    private options: AbilityOptions<P, T>;

    private _roles: Role[] = [
        {
            name: SystemRoles.USER,
            label: '普通用户',
            description: '新用户的默认角色',
            permissions: [],
        },
        {
            name: SystemRoles.SUPER_ADMIN,
            label: '超级管理员',
            description: '拥有整个系统的管理权限',
            permissions: [],
        },
    ];

    private _permissions: PermissionType<P, T>[] = [
        {
            name: SYSTEM_PERMISSION,
            label: '系统管理',
            description: '管理系统的所有功能',
            rule: {
                action: 'manage',
                subject: 'all',
            } as any,
        },
        // 用户管理权限
        {
            name: 'user-manage',
            label: '用户管理菜单',
            description: '管理系统用户菜单',
            rule: {
                action: 'manage',
                subject: 'MenuEntity',
            } as any,
        },
        // 角色管理权限
        {
            name: 'role-manage',
            label: '角色管理菜单',
            description: '管理系统角色菜单',
            rule: {
                action: 'manage',
                subject: 'MenuEntity',
            } as any,
        },
        // 权限管理权限
        {
            name: 'permission-manage',
            label: '权限管理菜单',
            description: '管理系统权限菜单',
            rule: {
                action: 'manage',
                subject: 'MenuEntity',
            } as any,
        },
        // 菜单管理权限
        {
            name: 'menu-manage',
            label: '菜单管理菜单',
            description: '管理系统菜单',
            rule: {
                action: 'manage',
                subject: 'MenuEntity',
            } as any,
        },
        // 内容管理权限
        {
            name: 'content-manage',
            label: '内容管理菜单',
            description: '管理系统内容菜单',
            rule: {
                action: 'manage',
                subject: 'PostEntity',
            } as any,
        },
    ];

    private _menus: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
        // 系统管理主菜单
        {
            name: '系统管理',
            code: 'system',
            caption: '系统管理',
            icon: 'settings',
            customOrder: 1000,
            type: MenuPermissionType.MENU,
        },
        // 用户管理
        {
            name: '用户管理',
            code: 'user-manage',
            parentId: 'system',
            caption: '用户管理',
            icon: 'people',
            path: '/system/users',
            component: 'UserManage',
            customOrder: 1010,
            type: MenuPermissionType.MENU,
        },
        // 角色管理
        {
            name: '角色管理',
            code: 'role-manage',
            parentId: 'system',
            caption: '角色管理',
            icon: 'security',
            path: '/system/roles',
            component: 'RoleManage',
            customOrder: 1020,
            type: MenuPermissionType.MENU,
        },
        // 权限管理
        {
            name: '权限管理',
            code: 'permission-manage',
            parentId: 'system',
            caption: '权限管理',
            icon: 'key',
            path: '/system/permissions',
            component: 'PermissionManage',
            customOrder: 1030,
            type: MenuPermissionType.MENU,
        },
        // 菜单管理
        {
            name: '菜单管理',
            code: 'menu-manage',
            parentId: 'system',
            caption: '菜单管理',
            icon: 'menu',
            path: '/system/menus',
            component: 'MenuManage',
            customOrder: 1040,
            type: MenuPermissionType.MENU,
        },
        // 内容管理主菜单
        {
            name: '内容管理',
            code: 'content',
            caption: '内容管理',
            icon: 'article',
            customOrder: 2000,
            type: MenuPermissionType.MENU,
        },
        // 文章管理
        {
            name: '文章管理',
            code: 'content-manage',
            parentId: 'content',
            caption: '文章管理',
            icon: 'description',
            path: '/content/posts',
            component: 'PostManage',
            customOrder: 2010,
            type: MenuPermissionType.MENU,
        },
        // 分类管理
        {
            name: '分类管理',
            code: 'category-manage',
            parentId: 'content',
            caption: '分类管理',
            icon: 'category',
            path: '/content/categories',
            component: 'CategoryManage',
            customOrder: 2020,
            type: MenuPermissionType.MENU,
        },
        // 标签管理
        {
            name: '标签管理',
            code: 'tag-manage',
            parentId: 'content',
            caption: '标签管理',
            icon: 'label',
            path: '/content/tags',
            component: 'TagManage',
            customOrder: 2030,
            type: MenuPermissionType.MENU,
        },
        // 评论管理
        {
            name: '评论管理',
            code: 'comment-manage',
            parentId: 'content',
            caption: '评论管理',
            icon: 'comment',
            path: '/content/comments',
            component: 'CommentManage',
            customOrder: 2040,
            type: MenuPermissionType.MENU,
        },
    ];

    constructor(
        protected dataSource: DataSource,
        protected configure: Configure,
    ) {}

    setOptions(options: AbilityOptions<P, T>) {
        if (!this.setuped) {
            this.options = options;
            this.setuped = true;
            console.log(this.options);
        }
        return this;
    }

    get roles() {
        return this._roles;
    }

    get permissions() {
        return this._permissions;
    }

    get menus() {
        return this._menus;
    }

    addRoles(data: Role[]) {
        this._roles = [...this._roles, ...data];
    }

    addMenus(data: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]) {
        this._menus = [...this._menus, ...data];
    }

    addPermissions(data: PermissionType<P, T>[]) {
        this._permissions = [...this._permissions, ...data].map((perm) => {
            let subject: typeof perm.rule.subject;
            if (isArray(perm.rule.subject)) {
                subject = perm.rule.subject.map((v) => getSubject(v));
            } else {
                subject = getSubject(perm.rule.subject);
            }
            const rule = { ...perm.rule, subject };
            return { ...perm, rule };
        });
    }
    async onApplicationBootstrap() {
        if (!this.dataSource.isInitialized) {
            return null;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await this.syncRoles(queryRunner.manager);
            await this.syncPermissions(queryRunner.manager);
            await this.syncMenus(queryRunner.manager);
            await this.syncSuperAdmin(queryRunner.manager);
            await queryRunner.commitTransaction();
        } catch (e) {
            console.log(e);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
        return true;
    }

    /**
     * 同步角色
     * @param manager
     */
    async syncRoles(manager: EntityManager) {
        this._roles = this.roles.reduce((o, n) => {
            if (o.map(({ name }) => name).includes(n.name)) {
                return o.map((e) => (e.name === n.name ? deepMerge(e, n, 'merge') : e));
            }
            return [...o, n];
        }, []);

        for (const item of this.roles) {
            let role = await manager.findOne(RoleEntity, {
                relations: ['permissions'],
                where: { name: item.name },
            });

            if (isNil(role)) {
                role = await manager.save(
                    manager.create(RoleEntity, {
                        name: item.name,
                        label: item.label,
                        description: item.description,
                        systemed: true,
                    }),
                    {
                        reload: true,
                    },
                );
            } else {
                await manager.update(RoleEntity, role.id, { systemed: true });
            }
        }

        const systemRoles = await manager.findBy(RoleEntity, { systemed: true });
        const toDels: string[] = [];
        for (const item of systemRoles) {
            if (isNil(this.roles.find(({ name }) => item.name === name))) {
                toDels.push(item.id);
            }
        }
        if (toDels.length > 0) {
            await manager.delete(RoleEntity, toDels);
        }
    }

    async syncPermissions(manager: EntityManager) {
        const permissions = await manager.find(PermissionEntity);
        const roles = await manager.find(RoleEntity, {
            relations: ['permissions'],
            where: { name: Not(SystemRoles.SUPER_ADMIN) },
        });
        const roleRepo = manager.getRepository(RoleEntity);

        // 合并并去除重复权限
        this._permissions = this.permissions.reduce(
            (o, n) => (o.map(({ name }) => name).includes(n.name) ? o : [...o, n]),
            [],
        );
        const names = this.permissions.map(({ name }) => name);

        for (const item of this.permissions) {
            const perm = omit(item, ['conditions']);
            const old = await manager.findOneBy(PermissionEntity, { name: perm.name });
            if (isNil(old)) {
                await manager.save(manager.create(PermissionEntity, perm));
            } else {
                await manager.update(PermissionEntity, old.id, perm);
            }
        }

        // 删除冗余权限
        const toDels: string[] = [];
        for (const item of permissions) {
            if (!names.includes(item.name) && item.name !== SYSTEM_PERMISSION) {
                toDels.push(item.id);
            }
        }
        if (toDels.length > 0) {
            await manager.delete(PermissionEntity, toDels);
        }

        // 同步普通角色
        for (const role of roles) {
            const rolePermissions =
                isNil(role.permissions) || role.permissions.length <= 0
                    ? []
                    : await manager.findBy(PermissionEntity, {
                          name: In(role.permissions.map(({ name }) => name)),
                      });
            await roleRepo
                .createQueryBuilder('role')
                .relation(RoleEntity, 'permissions')
                .of(role)
                .addAndRemove(
                    rolePermissions.map(({ id }) => id),
                    (role.permissions ?? []).map(({ id }) => id),
                );
        }

        // 同步超级管理员角色
        const superRole = await manager.findOneOrFail(RoleEntity, {
            relations: ['permissions'],
            where: { name: SystemRoles.SUPER_ADMIN },
        });
        const systemManage = await manager.findOneOrFail(PermissionEntity, {
            where: { name: SYSTEM_PERMISSION },
        });
        await roleRepo
            .createQueryBuilder('role')
            .relation(RoleEntity, 'permissions')
            .of(superRole)
            .addAndRemove(
                [systemManage.id],
                (superRole.permissions ?? []).map(({ id }) => id),
            );
    }

    async syncSuperAdmin(manager: EntityManager) {
        const superRole = await manager.findOneOrFail(RoleEntity, {
            relations: ['permissions'],
            where: { name: SystemRoles.SUPER_ADMIN },
        });
        const superUsers = await manager
            .createQueryBuilder(UserEntity, 'user')
            .leftJoinAndSelect('user.roles', 'roles')
            .where('roles.id IN (:...ids)', { ids: [superRole.id] })
            .getMany();

        if (superUsers.length < 1) {
            const userRepo = manager.getRepository(UserEntity);
            if ((await userRepo.count()) < 1) {
                throw new InternalServerErrorException(
                    'Please add a super-admin user first before run server!',
                );
            }

            const firstUser = await userRepo.findOneByOrFail({ id: undefined });
            await userRepo
                .createQueryBuilder('user')
                .relation(UserEntity, 'roles')
                .of(firstUser)
                .addAndRemove(
                    [superRole.id],
                    (firstUser.roles ?? []).map(({ id }) => id),
                );
        }
    }

    /**
     * 同步菜单
     * @param manager
     */
    async syncMenus(manager: EntityManager) {
        // 获取所有现有菜单
        const existingMenus = await manager.find(MenuEntity);
        const menuCodes = this.menus.map(({ code }) => code);

        // 按层级排序菜单，确保父菜单先创建
        const sortedMenus = this.sortMenusByLevel(this.menus);

        // 创建或更新菜单
        for (const menuData of sortedMenus) {
            let menu = await manager.findOne(MenuEntity, { where: { code: menuData.code } });

            // 查找关联的权限
            let permission: PermissionEntity | null = null;
            if (menuData.code !== 'system' && menuData.code !== 'content') {
                permission = await manager.findOne(PermissionEntity, {
                    where: { name: menuData.code },
                });
            }

            // 查找父菜单ID
            let parentId: string | undefined;
            if (menuData.parentId) {
                const parentMenu = await manager.findOne(MenuEntity, {
                    where: { code: menuData.parentId },
                });
                parentId = parentMenu?.id;
            }

            if (isNil(menu)) {
                // 创建新菜单
                menu = manager.create(MenuEntity, {
                    ...menuData,
                    parentId,
                    permission,
                });
                await manager.save(menu);
            } else {
                // 更新现有菜单
                await manager.update(MenuEntity, menu.id, {
                    ...menuData,
                    parentId,
                    permission,
                });
            }
        }

        // 删除不再需要的菜单
        const toDels: string[] = [];
        for (const menu of existingMenus) {
            if (!menuCodes.includes(menu.code)) {
                toDels.push(menu.id);
            }
        }
        if (toDels.length > 0) {
            await manager.delete(MenuEntity, toDels);
        }
    }

    /**
     * 按层级排序菜单，确保父菜单先创建
     */
    private sortMenusByLevel(
        menus: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[],
    ): Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] {
        const result: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [];
        const processed = new Set<string>();

        // 递归添加菜单，确保父菜单先添加
        const addMenu = (menuCode: string) => {
            if (processed.has(menuCode)) return;

            const menu = menus.find((m) => m.code === menuCode);
            if (!menu) return;

            // 如果有父菜单，先添加父菜单
            if (menu.parentId && !processed.has(menu.parentId)) {
                addMenu(menu.parentId);
            }

            result.push(menu);
            processed.add(menuCode);
        };

        // 添加所有菜单
        for (const menu of menus) {
            addMenu(menu.code);
        }

        return result;
    }
}
