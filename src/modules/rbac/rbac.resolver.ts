import { AbilityOptions, AbilityTuple, MongoQuery, SubjectType } from '@casl/ability';
import { InternalServerErrorException, OnApplicationBootstrap } from '@nestjs/common';

import { isArray, isNil, omit } from 'lodash';
import { DataSource, EntityManager, In, Not } from 'typeorm';

import { Configure } from '../config/configure';

import { deepMerge } from '../core/helpers';

import { UserEntity } from '../user/entities';

import { SYSTEM_PERMISSION, SystemRoles } from './constants';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionType, Role } from './types';

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

    addRoles(data: Role[]) {
        this._roles = [...this._roles, ...data];
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
            const rolePermissions = await manager.findBy(PermissionEntity, {
                name: In(this.roles.find(({ name }) => name === role.name).permissions),
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
            .where('roles.id IN (:...ids', { ids: [superRole.id] })
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
}
