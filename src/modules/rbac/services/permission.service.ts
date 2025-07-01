import { AbilityTuple, MongoQuery } from '@casl/ability';

import { Injectable } from '@nestjs/common';

import { isNil } from 'lodash';
import { SelectQueryBuilder } from 'typeorm';

import { BaseService } from '@/modules/database/base/service';

import { QueryHook } from '@/modules/database/types';

import { QueryPermissionDto } from '../dtos/permission.dto';
import { PermissionEntity } from '../entities/permission.entity';
import { PermissionRepository } from '../repositories/permission.repository';

type FindParams = {
    [key in keyof Omit<QueryPermissionDto, 'limit' | 'page'>]: QueryPermissionDto[key];
};

@Injectable()
export class PermissionService extends BaseService<
    PermissionEntity,
    PermissionRepository,
    FindParams
> {
    constructor(protected permissionRepository: PermissionRepository) {
        super(permissionRepository);
    }

    protected async buildListQuery(
        queryBuilder: SelectQueryBuilder<PermissionEntity>,
        options: FindParams,
        callback?: QueryHook<PermissionEntity>,
    ) {
        const qb = await super.buildListQB(queryBuilder, options, callback);
        if (!isNil(options.role)) {
            qb.andWhere('role.id IN (:...roles)', { roles: [options.role] });
        }
        return qb;
    }

    create(data: PermissionEntity): Promise<PermissionEntity<AbilityTuple, MongoQuery>> {
        throw new Error('Method not implemented.');
    }
    update(data: PermissionEntity): Promise<PermissionEntity<AbilityTuple, MongoQuery>> {
        throw new Error('Method not implemented.');
    }
}
