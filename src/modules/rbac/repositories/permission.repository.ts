import { AbilityTuple, MongoQuery } from '@casl/ability';

import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { PermissionEntity } from '../entities/permission.entity';

@CustomRepository(PermissionEntity)
export class PermissionRepository extends BaseRepository<PermissionEntity> {
    protected _qbName: string = 'permission';

    buildBaseQB(): SelectQueryBuilder<PermissionEntity<AbilityTuple, MongoQuery>> {
        return this.createQueryBuilder(this.qbName).leftJoinAndSelect(
            `${this.qbName}.roles`,
            'roles',
        );
    }
}
