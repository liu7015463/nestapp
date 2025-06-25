import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { RoleEntity } from '../entities/role.entity';

@CustomRepository(RoleEntity)
export class RoleRepository extends BaseRepository<RoleEntity> {
    protected _qbName: string = 'role';

    buildBaseQB(): SelectQueryBuilder<RoleEntity> {
        return this.createQueryBuilder(this.qbName).leftJoinAndSelect(
            `${this.qbName}.permissions`,
            'permissions',
        );
    }
}
