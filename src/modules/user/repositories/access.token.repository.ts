import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';
import { AccessTokenEntity } from '@/modules/user/entities';

@CustomRepository(AccessTokenEntity)
export class AccessTokenRepository extends BaseRepository<AccessTokenEntity> {
    protected _qbName: string = 'accessToken';

    buildBaseQB(): SelectQueryBuilder<AccessTokenEntity> {
        return super.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.createdAt`, 'DESC');
    }
}
