import { ForbiddenException, Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';
import { In, SelectQueryBuilder } from 'typeorm';

import { BaseService } from '@/modules/database/base/service';

import { QueryHook } from '@/modules/database/types';

import { CreateRoleDto, QueryRoleDto, UpdateRoleDto } from '../dtos/role.dtos';
import { RoleEntity } from '../entities/role.entity';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService extends BaseService<RoleEntity, RoleRepository> {
    protected enableTrash = true;

    constructor(
        protected roleRepository: RoleRepository,
        protected permissionRepository: PermissionRepository,
    ) {
        super(roleRepository);
    }

    async create(data: CreateRoleDto): Promise<RoleEntity> {
        const createRole = {
            ...data,
            permissions: data.permissions
                ? await this.permissionRepository.findBy({ id: In(data.permissions) })
                : [],
        };
        const item = await this.repository.save(createRole);
        return this.detail(item.id);
    }

    async update(data: UpdateRoleDto): Promise<RoleEntity> {
        const role = await this.detail(data.id);
        if (data.permissions) {
            await this.repository
                .createQueryBuilder('role')
                .relation(RoleEntity, 'permissions')
                .of(role)
                .addAndRemove(data.permissions, role.permissions ?? []);
        }
        await this.repository.update(data.id, omit(data, ['id', 'permissions']));
        return this.detail(data.id);
    }

    async delete(items: string[], trash = true): Promise<RoleEntity[]> {
        const roles = await this.repository.find({ where: { id: In(items) }, withDeleted: true });
        for (const role of roles) {
            if (role.systemed) {
                throw new ForbiddenException('can not remove systemed role!');
            }
        }

        if (!trash) {
            return this.repository.remove(roles);
        }
        const directs = roles.filter((item) => !isNil(item.deletedAt));
        const softs = roles.filter((item) => isNil(item.deletedAt));
        return [
            ...(await this.repository.remove(directs)),
            ...(await this.repository.softRemove(softs)),
        ];
    }

    protected async buildListQuery(
        queryBuilder: SelectQueryBuilder<RoleEntity>,
        options: QueryRoleDto,
        callback?: QueryHook<RoleEntity>,
    ) {
        const qb = await super.buildListQB(queryBuilder, options, callback);
        qb.leftJoinAndSelect(`${this.repository.qbName}.users`, 'users');
        if (!isNil(options.user)) {
            qb.andWhere('users.id IN (:...users)', { users: [options.user] });
        }
        return qb;
    }
}
